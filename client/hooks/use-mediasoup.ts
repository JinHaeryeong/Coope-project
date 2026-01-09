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

// --- 타입 정의 ---
type StreamType = "camera" | "screen" | "mic";

type ProducerInfo = {
    producerId: string;
    kind: MediaKind;
    appData: AppData & { type: StreamType };
    socketId: string;
};

export interface RemoteStreamInfo {
    producerId: string;
    socketId: string;
    type: StreamType;
    stream: MediaStream;
}

interface UseMediasoupReturn {
    streams: {
        camera: MediaStream | null;
        screen: MediaStream | null;
        mic: MediaStream | null;
    };
    remoteStreams: RemoteStreamInfo[];
    camEnabled: boolean;
    micEnabled: boolean;
    hasRemoteScreenShare: boolean;
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    toggleCamera: () => void;
    toggleScreen: () => void;
    toggleMic: () => Promise<void>;
}

export const useMediasoup = (
    roomId: string,
    onRemoteVideoStream?: (stream: MediaStream) => void
): UseMediasoupReturn => {
    // --- Refs: WebRTC 핵심 객체 및 소켓 관리 ---
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const deviceRef = useRef<MediaDevice | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // 이벤트 핸들러 최신화 및 재시도 타이머 관리
    const handleNewProducerRef = useRef<((info: ProducerInfo) => Promise<void>) | null>(null);
    const retryTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
    const retryCountsRef = useRef<Record<string, number>>({});

    // --- States: UI 동기화용 상태 ---
    const [streams, setStreams] = useState({
        camera: null as MediaStream | null,
        screen: null as MediaStream | null,
        mic: null as MediaStream | null,
    });
    const [remoteStreams, setRemoteStreams] = useState<RemoteStreamInfo[]>([]);
    const [camEnabled, setCamEnabled] = useState(false);
    const [micEnabled, setMicEnabled] = useState(false);
    const [myProducers, setMyProducers] = useState<Record<string, any>>({});

    const hasRemoteScreenShare = remoteStreams.some((s) => s.type === "screen");

    // --- 헬퍼: 안전한 Device 객체 참조 ---
    const getDevice = useCallback(() => {
        if (!deviceRef.current || !deviceRef.current.loaded) {
            throw new Error("Mediasoup Device가 로드되지 않았습니다.");
        }
        return deviceRef.current;
    }, []);

    // --- Mediasoup 로직: Worker/Router 연결 ---
    const createDevice = async (rtpCapabilities: RtpCapabilities) => {
        if (deviceRef.current?.loaded) return deviceRef.current;
        const dev = new MediaDevice();
        await dev.load({ routerRtpCapabilities: rtpCapabilities });
        deviceRef.current = dev;
        return dev;
    };

    const createRecvTransport = async () => {
        if (recvTransportRef.current) return recvTransportRef.current;
        const transportInfo = await new Promise<TransportOptions>((res) => {
            socketRef.current?.emit("create-recv-transport", {}, res);
        });
        const transport = getDevice().createRecvTransport(transportInfo);
        transport.on("connect", ({ dtlsParameters }, callback) => {
            socketRef.current?.emit("recv-transport-connect", { dtlsParameters }, callback);
        });
        recvTransportRef.current = transport;
        return transport;
    };

    const createSendTransport = async () => {
        if (sendTransportRef.current) return sendTransportRef.current;
        const transportInfo = await new Promise<TransportOptions>((res) => {
            socketRef.current?.emit("create-transport", {}, res);
        });
        const transport = getDevice().createSendTransport(transportInfo);

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

    // --- 신규 참여자(Producer) 처리 ---
    const handleNewProducer = useCallback(async (info: ProducerInfo) => {
        const socket = socketRef.current;

        if (!deviceRef.current?.loaded) {
            const currentRetry = retryCountsRef.current[info.producerId] || 0;
            if (currentRetry > 10) return;
            if (retryTimersRef.current[info.producerId]) clearTimeout(retryTimersRef.current[info.producerId]);
            retryCountsRef.current[info.producerId] = currentRetry + 1;
            retryTimersRef.current[info.producerId] = setTimeout(() => handleNewProducer(info), 500);
            return;
        }

        if (!socket) return;
        const transport = await createRecvTransport();

        const { id, producerId, kind, rtpParameters } = await new Promise<any>((res) => {
            socket.emit("consume", {
                producerId: info.producerId,
                rtpCapabilities: getDevice().rtpCapabilities
            }, res);
        });

        const consumer = await transport.consume({ id, producerId, kind, rtpParameters });
        const stream = new MediaStream([consumer.track]);

        if (kind === "video") {
            setRemoteStreams((prev) => [
                ...prev.filter(s => s.producerId !== info.producerId),
                { producerId: info.producerId, socketId: info.socketId, type: info.appData.type, stream }
            ]);
            onRemoteVideoStream?.(stream);
        } else {
            const audioEl = new Audio();
            audioEl.srcObject = stream;
            audioEl.autoplay = true;
            audioEl.setAttribute("data-producer-id", producerId);
            document.body.appendChild(audioEl);
        }

        consumer.on("trackended", () => {
            setRemoteStreams((prev) => prev.filter((s) => s.producerId !== producerId));
        });
    }, [onRemoteVideoStream, getDevice]);

    useEffect(() => {
        handleNewProducerRef.current = handleNewProducer;
    }, [handleNewProducer]);

    // --- 미디어 제어 함수 (Refactoring: Consistency 추가) ---
    const stopMedia = useCallback((type: StreamType) => {
        setStreams((prev) => {
            const currentStream = prev[type];
            if (currentStream) {
                currentStream.getTracks().forEach((t) => t.stop());
            }
            return { ...prev, [type]: null };
        });

        const producer = myProducers[type];
        if (producer) {
            socketRef.current?.emit("close-producer", producer.id);
            producer.close();
            setMyProducers((prev) => {
                const newProducers = { ...prev };
                delete newProducers[type];
                return newProducers;
            });
        }

        // 상태 플래그 업데이트
        if (type === "camera") setCamEnabled(false);
        if (type === "mic") setMicEnabled(false);
    }, [myProducers]);

    const startMedia = async (type: StreamType) => {
        try {
            if (type === "camera" && streams.screen) stopMedia("screen");
            if (type === "screen" && streams.camera) stopMedia("camera");

            // [Ref반영] Ideal 설정을 통해 기기 호환성 확보
            const stream = type === "camera"
                ? await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
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

            videoTrack.onended = () => stopMedia(type);
        } catch (error) {
            console.error(`${type} 시작 실패:`, error);
        }
    };

    const toggleCamera = () => (streams.camera ? stopMedia("camera") : startMedia("camera"));
    const toggleScreen = () => (streams.screen ? stopMedia("screen") : startMedia("screen"));

    const toggleMic = async () => {
        if (micEnabled) {
            stopMedia("mic");
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const transport = await createSendTransport();
                const producer = await transport.produce({
                    track: stream.getAudioTracks()[0],
                    appData: { type: "mic" }
                });
                setMyProducers(prev => ({ ...prev, mic: producer }));
                setStreams(prev => ({ ...prev, mic: stream }));
                setMicEnabled(true);
            } catch (error) {
                console.error("마이크 시작 실패:", error);
            }
        }
    };

    // --- Socket 및 연결 생명주기 관리 ---
    useEffect(() => {
        const SERVER_URL = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:4000";
        const sock = io(SERVER_URL);
        socketRef.current = sock;

        sock.on("connect", async () => {
            sock.emit("joinRoom", roomId, async (rtpCapabilities: RtpCapabilities) => {
                await createDevice(rtpCapabilities);
                sock.emit("getExistingProducers", (producers: ProducerInfo[]) => {
                    producers.forEach((p) => handleNewProducerRef.current?.(p));
                });
            });
        });

        sock.on("new-producer", (info) => {
            handleNewProducerRef.current?.(info);
        });

        sock.on("producer-closed", (id) => {
            setRemoteStreams((prev) => prev.filter((s) => s.producerId !== id));
            document.querySelectorAll(`audio[data-producer-id="${id}"]`).forEach(el => el.remove());
        });

        return () => {
            sock.disconnect();
            sendTransportRef.current?.close();
            recvTransportRef.current?.close();
            sendTransportRef.current = null;
            recvTransportRef.current = null;
            deviceRef.current = null;
            Object.values(retryTimersRef.current).forEach(clearTimeout);
        };
    }, [roomId]);

    return {
        streams,
        remoteStreams,
        camEnabled,
        micEnabled,
        hasRemoteScreenShare,
        localVideoRef,
        toggleCamera,
        toggleScreen,
        toggleMic,
    };
};