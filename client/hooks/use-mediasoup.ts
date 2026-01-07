"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Device as MediaDevice } from "mediasoup-client";
import {
    RtpCapabilities,
    TransportOptions,
    MediaKind,
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
    // Copilot 조언대로 컴포넌트 상단에 타이머 보관용 Ref 추가
    const retryTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
    const retryCountsRef = useRef<Record<string, number>>({});

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
        if (!deviceRef.current || !deviceRef.current.loaded) {
            const currentRetry = retryCountsRef.current[info.producerId] || 0;
            if (currentRetry > 10) {
                console.error(`장치 로딩 실패: 프로듀서 ${info.producerId} 수신 불가`);
                delete retryCountsRef.current[info.producerId];
                return;
            }
            // 이미 예약된 타이머가 있으면 취소 (중복 실행 방지)
            if (retryTimersRef.current[info.producerId]) {
                clearTimeout(retryTimersRef.current[info.producerId]);
            }
            console.log("장치 로딩 대기 중... 재시도합니다.");
            retryCountsRef.current[info.producerId] = currentRetry + 1;
            retryTimersRef.current[info.producerId] = setTimeout(() => {
                handleNewProducer(info);
            }, 500);
            return;
        }
        if (retryTimersRef.current[info.producerId]) {
            clearTimeout(retryTimersRef.current[info.producerId]);
            delete retryTimersRef.current[info.producerId];
        }
        const device = deviceRef.current;

        if (!socket) return;

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
        setStreams((prev) => {
            const stream = prev[type];
            stream?.getTracks().forEach((t) => t.stop());
            return { ...prev, [type]: null };
        });

        setMyProducers((prev) => {
            const producer = prev[type];
            if (producer) {
                console.log(`[Client] Producer 종료 요청: ${type}`);
                socketRef.current?.emit("close-producer", producer.id);
                producer.close();
            }
            return { ...prev, [type]: undefined };
        });

        if (type === "camera") setCamEnabled(false);

        // Transport는 다른 미디어(마이크 등)가 없을 때만 닫거나, 
        // 사실 굳이 닫지 않고 유지하는 것이 재연결 성능에 더 좋습니다.
    };

    const startMedia = async (type: StreamType) => {
        // 반대 미디어 종료 (카메라 켜면 화면공유 끄기 등)
        if (type === "camera" && streams.screen) stopMedia("screen");
        if (type === "screen" && streams.camera) stopMedia("camera");

        const stream = type === "camera"
            ? await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 }, // ideal을 사용하여 유연하게 대응
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                }
            })
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
            videoTrack.onended = () => {
                console.log("화면 공유 트랙 종료됨 (브라우저 UI)");

                // 서버에 알리기
                socketRef.current?.emit("close-producer", producer.id);

                // 미디어 클로즈
                producer.close();
                stream.getTracks().forEach(t => t.stop());

                // 상태 정리
                setMyProducers(prev => ({ ...prev, screen: undefined }));
                setStreams(prev => ({ ...prev, screen: null }));
            };
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
        const SERVER_URL = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:4000";
        const sock = io(SERVER_URL);
        socketRef.current = sock;

        sock.on("connect", async () => {
            sock.emit("joinRoom", roomId, async (rtpCapabilities: RtpCapabilities) => {
                await createDevice(rtpCapabilities);
            });
        });

        sock.on("existingProducers", (producers: ProducerInfo[]) => producers.forEach(handleNewProducer));
        sock.on("new-producer", handleNewProducer);
        sock.on("producer-closed", (id) => {
            console.log(`서버로부터 프로듀서 종료 알림 받음: ${id}`);

            // 1. DOM 제거
            remoteContainerRef.current?.querySelector(`[data-producer-id="${id}"]`)?.remove();
            document.querySelector(`audio[data-producer-id="${id}"]`)?.remove();

            // 2. 화면 공유 상태 업데이트
            if (hasRemoteScreenShare) {
                const remainingScreen = remoteContainerRef.current?.querySelector('[data-type="screen"]');
                if (!remainingScreen) setHasRemoteScreenShare(false);
            }
        });

        return () => {
            sock.disconnect();
            sendTransportRef.current?.close();
            recvTransportRef.current?.close();

            // 모든 재시도 타이머 제거 (메모리 누수 방지)
            Object.values(retryTimersRef.current).forEach(clearTimeout);
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