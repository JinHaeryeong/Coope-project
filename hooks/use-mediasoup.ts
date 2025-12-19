"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Device as MediaDevice } from "mediasoup-client";
import {
    RtpCapabilities,
    TransportOptions,
    MediaKind,
    RtpParameters,
    AppData,
    Transport,
} from "mediasoup-client/types";

// 타입 정의
type StreamType = "camera" | "screen" | "mic";

type ProducerInfo = {
    producerId: string;
    kind: MediaKind;
    appData: AppData & { type: StreamType };
    socketId: string;
};

interface UseMediasoupReturn {
    streams: {
        camera: MediaStream | null;
        screen: MediaStream | null;
        mic: MediaStream | null;
    };
    camEnabled: boolean;
    micEnabled: boolean;
    hasRemoteScreenShare: boolean;
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteContainerRef: React.RefObject<HTMLDivElement | null>;
    toggleCamera: () => void;
    toggleScreen: () => void;
    toggleMic: () => Promise<void>;
}

export const useMediasoup = (
    roomId: string,
    onRemoteVideoStream?: (stream: MediaStream) => void
): UseMediasoupReturn => {
    // Refs & States
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const deviceRef = useRef<MediaDevice | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteContainerRef = useRef<HTMLDivElement>(null);

    const [streams, setStreams] = useState({
        camera: null as MediaStream | null,
        screen: null as MediaStream | null,
        mic: null as MediaStream | null,
    });

    const [camEnabled, setCamEnabled] = useState(false);
    const [micEnabled, setMicEnabled] = useState(false);
    const [hasRemoteScreenShare, setHasRemoteScreenShare] = useState(false);
    const [myProducers, setMyProducers] = useState<Record<string, any>>({});

    // Mediasoup Core Functions
    const createDevice = async (rtpCapabilities: RtpCapabilities) => {
        const dev = new MediaDevice();
        await dev.load({ routerRtpCapabilities: rtpCapabilities });
        deviceRef.current = dev;
        return dev;
    };

    const getRtpCapabilities = async (): Promise<RtpCapabilities> => {
        return await new Promise((res) => {
            socketRef.current?.emit("getRouterRtpCapabilities", {}, res);
        });
    };

    const createSendTransport = async () => {
        if (sendTransportRef.current) return sendTransportRef.current;

        const transportInfo = await new Promise<TransportOptions>((res) => {
            socketRef.current?.emit("create-transport", {}, res);
        });

        const dev = deviceRef.current ?? (await createDevice(await getRtpCapabilities()));
        const transport = dev.createSendTransport(transportInfo);

        transport.on("connect", ({ dtlsParameters }, callback) => {
            socketRef.current?.emit("transport-connect", { dtlsParameters });
            callback();
        });

        transport.on("produce", ({ kind, rtpParameters, appData }, callback) => {
            socketRef.current?.emit("transport-produce", { kind, rtpParameters, appData }, ({ id }: { id: string }) => {
                callback({ id });
            });
        });

        sendTransportRef.current = transport;
        return transport;
    };

    const createRecvTransport = async () => {
        if (recvTransportRef.current) return recvTransportRef.current;

        const transportInfo = await new Promise<TransportOptions>((res, rej) => {
            if (!socketRef.current) return rej("소켓 없음");
            socketRef.current.emit("create-recv-transport", {}, res);
        });

        const dev = deviceRef.current ?? (await createDevice(await getRtpCapabilities()));
        const transport = dev.createRecvTransport(transportInfo);

        transport.on("connect", ({ dtlsParameters }, callback) => {
            socketRef.current?.emit("recv-transport-connect", { dtlsParameters }, callback);
        });

        recvTransportRef.current = transport;
        return transport;
    };

    const handleNewProducer = useCallback(async (info: ProducerInfo) => {
        const socket = socketRef.current;
        const device = deviceRef.current;
        if (!device || !socket) return;

        const transport = await createRecvTransport();
        const { id, producerId, kind, rtpParameters, appData } = await new Promise<any>((res) => {
            socket.emit("consume", { producerId: info.producerId, rtpCapabilities: device.rtpCapabilities }, res);
        });

        const consumer = await transport.consume({ id, producerId, kind, rtpParameters });
        const stream = new MediaStream([consumer.track]);

        if (kind === "video") {
            const videoEl = document.createElement("video");
            videoEl.srcObject = stream;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.setAttribute("data-producer-id", producerId);
            videoEl.setAttribute("data-type", appData.type);
            videoEl.className = "w-full h-full object-cover border border-white";

            setHasRemoteScreenShare(true);
            remoteContainerRef.current?.appendChild(videoEl);
            onRemoteVideoStream?.(stream);
        } else {
            const audioEl = document.createElement("audio");
            audioEl.srcObject = stream;
            audioEl.autoplay = true;
            audioEl.setAttribute("data-producer-id", producerId);
            document.body.appendChild(audioEl);
        }

        consumer.on("trackended", () => {
            document.querySelector(`[data-producer-id="${producerId}"]`)?.remove();
            if (appData.type === "screen") {
                setHasRemoteScreenShare(!!remoteContainerRef.current?.querySelector('[data-type="screen"]'));
            }
        });
    }, [onRemoteVideoStream]);

    // Media Controls (Toggle Functions)
    const stopMedia = (type: StreamType) => {
        const stream = type === "camera" ? streams.camera : streams.screen;
        stream?.getTracks().forEach((t) => t.stop());

        const producer = myProducers[type];
        if (producer) {
            producer.close();
            socketRef.current?.emit("close-producer", producer.id);
            setMyProducers((prev) => ({ ...prev, [type]: undefined }));
        }

        if (type === "camera") {
            setStreams(prev => ({ ...prev, camera: null }));
            setCamEnabled(false);
        } else {
            setStreams(prev => ({ ...prev, screen: null }));
        }

        if (Object.values(myProducers).filter(Boolean).length <= 1) {
            sendTransportRef.current?.close();
            sendTransportRef.current = null;
        }
    };

    const startMedia = async (type: StreamType) => {
        // 반대 미디어 종료 (카메라 켜면 화면공유 끄기 등)
        if (type === "camera" && streams.screen) stopMedia("screen");
        if (type === "screen" && streams.camera) stopMedia("camera");

        const stream = type === "camera"
            ? await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } })
            : await navigator.mediaDevices.getDisplayMedia({ video: true });

        const transport = await createSendTransport();
        const videoTrack = stream.getVideoTracks()[0];
        const producer = await transport.produce({ track: videoTrack, appData: { type } });

        setMyProducers(prev => ({ ...prev, [type]: producer }));
        setStreams(prev => ({ ...prev, [type]: stream }));
        if (type === "camera") setCamEnabled(true);

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([videoTrack]);
        }

        if (type === "screen") {
            videoTrack.addEventListener("ended", () => stopMedia("screen"));
        }
    };

    const toggleCamera = () => streams.camera ? stopMedia("camera") : startMedia("camera");
    const toggleScreen = () => streams.screen ? stopMedia("screen") : startMedia("screen");

    const toggleMic = async () => {
        if (micEnabled) {
            streams.mic?.getTracks().forEach(t => t.stop());
            myProducers.mic?.close();
            socketRef.current?.emit("close-producer", myProducers.mic?.id);
            setMyProducers(prev => ({ ...prev, mic: undefined }));
            setStreams(prev => ({ ...prev, mic: null }));
            setMicEnabled(false);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const transport = await createSendTransport();
            const producer = await transport.produce({ track: stream.getAudioTracks()[0], appData: { type: "mic" } });
            setMyProducers(prev => ({ ...prev, mic: producer }));
            setStreams(prev => ({ ...prev, mic: stream }));
            setMicEnabled(true);
        }
    };

    // Socket Lifecycle
    useEffect(() => {
        const sock = io("http://localhost:4000");
        socketRef.current = sock;

        sock.on("connect", async () => {
            sock.emit("joinRoom", roomId, async (rtpCapabilities: RtpCapabilities) => {
                await createDevice(rtpCapabilities);
            });
        });

        sock.on("existingProducers", (producers: ProducerInfo[]) => producers.forEach(handleNewProducer));
        sock.on("new-producer", handleNewProducer);
        sock.on("producer-closed", (id) => {
            remoteContainerRef.current?.querySelector(`[data-producer-id="${id}"]`)?.remove();
            document.querySelector(`audio[data-producer-id="${id}"]`)?.remove();
        });

        return () => {
            sock.disconnect();
            sendTransportRef.current?.close();
            recvTransportRef.current?.close();
        };
    }, [roomId, handleNewProducer]);

    return {
        streams,
        camEnabled,
        micEnabled,
        hasRemoteScreenShare,
        localVideoRef,
        remoteContainerRef,
        toggleCamera,
        toggleScreen,
        toggleMic
    };
};