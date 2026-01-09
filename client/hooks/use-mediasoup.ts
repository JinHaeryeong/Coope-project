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
    // --- Refs: 소켓 및 WebRTC 핵심 객체 (리렌더링 시에도 유지) ---
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const deviceRef = useRef<MediaDevice | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // handleNewProducer를 Ref에 담아 useEffect 의존성에서 제거 (무한 루프 방지)
    const handleNewProducerRef = useRef<((info: ProducerInfo) => Promise<void>) | null>(null);
    const retryTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
    const retryCountsRef = useRef<Record<string, number>>({});

    // --- States: UI 렌더링에 사용되는 상태 ---
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

    // --- Mediasoup 핵심 함수들 ---

    // 1. 장치 초기화 (Router RTP 성능 정보 수신 후 로드)
    const createDevice = async (rtpCapabilities: RtpCapabilities) => {
        if (deviceRef.current?.loaded) return deviceRef.current;
        const dev = new MediaDevice();
        await dev.load({ routerRtpCapabilities: rtpCapabilities });
        deviceRef.current = dev;
        return dev;
    };

    // 2. 수신용 트랜스포트 생성 (상대방 데이터를 받기 위함)
    const createRecvTransport = async () => {
        if (recvTransportRef.current) return recvTransportRef.current;
        const transportInfo = await new Promise<TransportOptions>((res) => {
            socketRef.current?.emit("create-recv-transport", {}, res);
        });
        const transport = deviceRef.current!.createRecvTransport(transportInfo);
        transport.on("connect", ({ dtlsParameters }, callback) => {
            socketRef.current?.emit("recv-transport-connect", { dtlsParameters }, callback);
        });
        recvTransportRef.current = transport;
        return transport;
    };

    // 3. 송신용 트랜스포트 생성 (내 데이터를 서버로 보내기 위함)
    const createSendTransport = async () => {
        if (sendTransportRef.current) return sendTransportRef.current;
        const transportInfo = await new Promise<TransportOptions>((res) => {
            socketRef.current?.emit("create-transport", {}, res);
        });
        const transport = deviceRef.current!.createSendTransport(transportInfo);

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

    // 4. 새로운 참여자의 스트림 처리
    const handleNewProducer = useCallback(async (info: ProducerInfo) => {
        const socket = socketRef.current;

        // 장치 로딩 재시도 로직 (장치가 로드될 때까지 대기)
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

        // 서버에 consume 요청
        const { id, producerId, kind, rtpParameters } = await new Promise<any>((res) => {
            socket.emit("consume", {
                producerId: info.producerId,
                rtpCapabilities: deviceRef.current!.rtpCapabilities
            }, res);
        });

        const consumer = await transport.consume({ id, producerId, kind, rtpParameters });
        const stream = new MediaStream([consumer.track]);

        if (kind === "video") {
            // 비디오 스트림은 상태 배열에 저장하여 UI에서 렌더링
            setRemoteStreams((prev) => [
                ...prev.filter(s => s.producerId !== info.producerId),
                { producerId: info.producerId, socketId: info.socketId, type: info.appData.type, stream }
            ]);
            onRemoteVideoStream?.(stream);
        } else {
            // 오디오는 HTMLAudioElement로 즉시 재생
            const audioEl = new Audio();
            audioEl.srcObject = stream;
            audioEl.autoplay = true;
            audioEl.setAttribute("data-producer-id", producerId);
            document.body.appendChild(audioEl);
        }

        consumer.on("trackended", () => {
            setRemoteStreams((prev) => prev.filter((s) => s.producerId !== producerId));
        });
    }, [onRemoteVideoStream]);

    // handleNewProducerRef를 최신화
    useEffect(() => {
        handleNewProducerRef.current = handleNewProducer;
    }, [handleNewProducer]);

    // --- 미디어 제어 함수들 ---

    const stopMedia = (type: StreamType) => {
        setStreams((prev) => {
            prev[type]?.getTracks().forEach((t) => t.stop());
            return { ...prev, [type]: null };
        });

        const producer = myProducers[type];
        if (producer) {
            socketRef.current?.emit("close-producer", producer.id);
            producer.close();
            setMyProducers((prev) => ({ ...prev, [type]: undefined }));
        }
        if (type === "camera") setCamEnabled(false);
    };

    const startMedia = async (type: StreamType) => {
        // 카메라와 화면공유는 상호 배타적 (하나를 켜면 다른 건 끔)
        if (type === "camera" && streams.screen) stopMedia("screen");
        if (type === "screen" && streams.camera) stopMedia("camera");

        const stream = type === "camera"
            ? await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
            : await navigator.mediaDevices.getDisplayMedia({ video: true });

        const transport = await createSendTransport();
        const videoTrack = stream.getVideoTracks()[0];
        const producer = await transport.produce({ track: videoTrack, appData: { type } });

        setMyProducers(prev => ({ ...prev, [type]: producer }));
        setStreams(prev => ({ ...prev, [type]: stream }));
        if (type === "camera") setCamEnabled(true);

        videoTrack.onended = () => stopMedia(type);
    };

    const toggleCamera = () => (streams.camera ? stopMedia("camera") : startMedia("camera"));
    const toggleScreen = () => (streams.screen ? stopMedia("screen") : startMedia("screen"));

    const toggleMic = async () => {
        if (micEnabled) {
            stopMedia("mic");
            setMicEnabled(false);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const transport = await createSendTransport();
            const producer = await transport.produce({
                track: stream.getAudioTracks()[0],
                appData: { type: "mic" }
            });
            setMyProducers(prev => ({ ...prev, mic: producer }));
            setStreams(prev => ({ ...prev, mic: stream }));
            setMicEnabled(true);
        }
    };

    // --- Socket 생명주기 관리 (가장 중요) ---
    useEffect(() => {
        const SERVER_URL = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:4000";
        const sock = io(SERVER_URL);
        socketRef.current = sock;

        sock.on("connect", async () => {
            console.log("시그널링 서버 연결됨");
            sock.emit("joinRoom", roomId, async (rtpCapabilities: RtpCapabilities) => {
                await createDevice(rtpCapabilities);
                // 기존 방에 있는 사람들의 정보 수신
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
            // 컴포넌트 언마운트 시 연결 정리
            sock.disconnect();
            sendTransportRef.current?.close();
            recvTransportRef.current?.close();
            sendTransportRef.current = null;
            recvTransportRef.current = null;
            deviceRef.current = null;
            Object.values(retryTimersRef.current).forEach(clearTimeout);
        };
    }, [roomId]); // [중요] handleNewProducer를 제외하여 미디어 변경 시 재연결 방지

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