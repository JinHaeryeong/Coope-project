"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  RtpCapabilities,
  TransportOptions,
  MediaKind,
  RtpParameters,
  AppData,
  Transport,
  Producer
} from "mediasoup-client/types";
import { Device as MediaDevice } from "mediasoup-client";
import "webrtc-adapter";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, ScreenShare, ScreenShareOff, NotebookPen } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";

interface WebRtcProps {
  roomId: string;
  onRemoteVideoStream?: (stream: MediaStream) => void;
}

type StreamType = "camera" | "screen" | "mic";

type ProducerInfo = {
  producerId: string;
  kind: MediaKind;
  appData: AppData & { type: StreamType };
  socketId: string;
};

export default function WebRtcComponent({ roomId, onRemoteVideoStream }: WebRtcProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null); // 내 비디오
  const remoteContainerRef = useRef<HTMLDivElement>(null); // 수신되는 비디오

  const socketRef = useRef<ReturnType<typeof io> | null>(null); // useState를 통해 socket을 뿌렸더니 비동기적으로 업데이트 돼서 이전값이라 socket connected가 계속 false로 바뀌는 현상때문에 uesRef로 바꿈
  const [device, setDevice] = useState<MediaDevice | null>(null); // device
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null); //카메라 스트림
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null); //화면 스트림
  const [micStream, setMicStream] = useState<MediaStream | null>(null); //마이크 스트림
  const [micEnabled, setMicEnabled] = useState(false); //마이크
  const [camEnabled, setCamEnabled] = useState(false);
  const deviceRef = useRef<MediaDevice | null>(null); //device도 useState로할시 같은 현상이 나타나서 create해줄때랑 그리고 device를 쓰는 상황에 이걸씀
  const [hasRemoteScreenShare, setHasRemoteScreenShare] = useState(false); //상대방이 공유하고 있는 화면이 있을때 내 비디오 css를 바꿔주기 위해 추가한 것
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const [myProducers, setMyProducers] = useState<{ [key in StreamType]?: any }>({});
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sendMessage = useMutation(api.chat.sendMessage);
  const { userId } = useAuth();
  const createDocument = useMutation(api.documents.create);
  const router = useRouter();
  const params = useParams();
  const getSidebar = useQuery(api.documents.getSidebar, {
    workspaceId: params.workspaceId as string,
    parentDocument: undefined
  });
  const isHandledRef = useRef(false);

  //디바이스 생성
  const createDevice = async (rtpCapabilities: RtpCapabilities) => {
    const dev = new MediaDevice();
    await dev.load({ routerRtpCapabilities: rtpCapabilities });
    setDevice(dev);
    deviceRef.current = dev;
    console.log("[Device] Device created and loaded");
    return dev;
  };

  const getRtpCapabilities = async (): Promise<RtpCapabilities> => {
    console.log("[Socket] getRtpCapabilities 요청");
    return await new Promise((res) => {
      socketRef.current?.emit("getRouterRtpCapabilities", {}, res);
    });
  };

  const createRecvTransport = async () => {
    if (recvTransportRef.current) {
      console.log("[Transport] 기존 수신 transport 사용");
      return recvTransportRef.current;
    }
    console.log("[Transport] createRecvTransport 요청");
    const transportInfo = await new Promise<TransportOptions>((res, rej) => {
      const socket = socketRef.current;
      if (!socket) return rej("소켓 없음");
      socket.emit("create-recv-transport", {}, (response: TransportOptions | PromiseLike<TransportOptions>) => {
        console.log("[Transport] create-recv-transport 응답:", response);
        res(response);
      });
    });

    const dev = device ?? (await createDevice(await getRtpCapabilities()));
    const transport = dev.createRecvTransport(transportInfo);

    transport.on("connect", ({ dtlsParameters }, callback) => {
      console.log("[Transport] recv-transport 연결 시작");
      socketRef.current?.emit("recv-transport-connect", { dtlsParameters }, () => {
        console.log("[Transport] recv-transport 연결 완료");
        callback();
      });
    });

    transport.on("connectionstatechange", (state) => {
      console.log("[Transport] 수신 트랜스포트 상태:", state);
    });

    recvTransportRef.current = transport;
    return transport;
  };

  const handleNewProducer = useCallback(async (info: ProducerInfo) => {
    console.log("[Consumer] new producer 수신:", info);

    const socket = socketRef.current;
    const device = deviceRef.current;
    if (!device || !socket) {
      console.warn("[Consumer] Device 또는 Socket이 없음");
      return;
    }

    const rtpCapabilities = device.rtpCapabilities;
    const transport = await createRecvTransport();

    const { id, producerId, kind, rtpParameters, appData } = await new Promise<{
      id: string;
      producerId: string;
      kind: MediaKind;
      rtpParameters: RtpParameters;
      appData: AppData & { type: StreamType };
    }>((res) => {
      socket.emit("consume", { producerId: info.producerId, rtpCapabilities }, res);
    });

    const consumer = await transport.consume({ id, producerId, kind, rtpParameters });
    const stream = new MediaStream([consumer.track]);
    console.log(" 새 스트림: ", stream);
    console.log(" 비디오 트랙 세팅:", consumer.track.getSettings?.());
    if (kind == "video") {
      const videoEl = document.createElement("video");
      videoEl.srcObject = stream;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.addEventListener("loadedmetadata", () => console.log("메타데이터 로드"));
      videoEl.addEventListener("canplay", () => console.log("재생 가능"));
      videoEl.addEventListener("play", () => console.log("재생중"));
      videoEl.addEventListener("error", (e) => console.error("비디오 에러", e));
      videoEl.setAttribute("data-producer-id", producerId);
      videoEl.setAttribute("data-type", appData.type);
      videoEl.className = "w-full h-full object-cover border border-white";

      // if (appData.type === "screen") {
      //   setHasRemoteScreenShare(true);
      // }
      setHasRemoteScreenShare(true);
      const container = remoteContainerRef.current;
      if (container) {
        const existing = container.querySelector(`[data-producer-id="${producerId}"]`);
        if (existing) {
          container.removeChild(existing);
          console.log("[DOM] 기존 video 제거 후 새로 추가");
        }
        container.appendChild(videoEl);
        console.log("[DOM] 추가된 비디오 수:", container.children.length);
      }
      onRemoteVideoStream?.(stream);
    }
    if (kind == "audio") {
      const audioEl = document.createElement("audio");
      audioEl.srcObject = stream;
      audioEl.autoplay = true;
      audioEl.controls = false;

      audioEl.setAttribute("data-producer-id", producerId);

      document.body.appendChild(audioEl);

      console.log(`[Dom] 오디오 추가됨`);

    }
    consumer.on("trackended", () => {
      console.log("[Consumer] consumer track ended:", producerId);
      const el = document.querySelector(`[data-producer-id="${producerId}"]`);
      if (el) el.remove();
      if (appData.type === "screen") {

        setHasRemoteScreenShare(
          !!remoteContainerRef.current?.querySelector('[data-type="screen"]')
        );
      }
    });

  }, []);

  const setupSocket = useCallback(() => {
    const sock = io("http://localhost:4000");
    socketRef.current = sock;

    sock.on("connect", async () => {
      console.log("[Socket] 연결됨:", sock.id);

      let recivedExistingProducers: ProducerInfo[] = [];
      const rtpCapabilities = await new Promise<RtpCapabilities>((res) => {
        sock.emit("joinRoom", roomId, res);
      });
      await createDevice(rtpCapabilities);
    });

    // 이부분을 제거하기
    sock.on("existingProducers", (producers: ProducerInfo[]) => {
      console.log("[Socket] 기존 producers 수신:", producers);
      producers.forEach(handleNewProducer);
    });

    sock.on("new-producer", (info: ProducerInfo) => {
      console.log("[Socket] 새로운 producer 수신:", info);
      handleNewProducer(info);
    });

    sock.on("producer-closed", (producerId: string) => {
      console.log("[Socket] producer 종료됨:", producerId);
      const container = remoteContainerRef.current;
      const el = container?.querySelector(`[data-producer-id="${producerId}"]`)
        ?? document.querySelector(`audio[data-producer-id="${producerId}"]`);

      if (el) el.remove();

    });

    return sock;
  }, [roomId, handleNewProducer]);

  useEffect(() => {
    const sock = setupSocket();
    return () => {
      console.log("[Socket] 클린업: 연결 해제");
      sock.disconnect();
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportRef.current = null;
    };
  }, [setupSocket]);

  const createSendTransport = async () => {
    // transport 재사용
    if (sendTransportRef.current) {
      console.log("[Transport] 기존 sendTransport 재사용");
      return sendTransportRef.current;
    }

    console.log("[Transport] createSendTransport 요청");

    const transportInfo = await new Promise<TransportOptions>((res) => {
      socketRef.current?.emit("create-transport", {}, res);
    });

    // device가 없으면 생성
    const dev = device ?? (await createDevice(await getRtpCapabilities()));
    const transport = dev.createSendTransport(transportInfo);

    transport.on("connect", ({ dtlsParameters }, callback) => {
      console.log("[Transport] 송신 연결 요청");
      socketRef.current?.emit("transport-connect", { dtlsParameters });
      callback();
    });

    transport.on("produce", ({ kind, rtpParameters, appData }, callback) => {
      console.log("[Transport] produce 요청:", kind, appData);
      socketRef.current?.emit("transport-produce", { kind, rtpParameters, appData }, ({ id }: { id: string }) => {
        callback({ id });
      });
    });

    sendTransportRef.current = transport;
    return transport;
  };



  const startMedia = async (type: StreamType) => {
    console.log(`[Media] ${type} 시작`);

    stopOppositeMedia(type);

    const stream =
      type === "camera"
        ? await navigator.mediaDevices.getUserMedia({
          video:
            { width: 320, height: 240, frameRate: { ideal: 10, max: 15 } },
        })
        : await navigator.mediaDevices.getDisplayMedia({ video: true });

    const transport = await createSendTransport();

    const newProducers: { [key in StreamType]?: any } = {};

    if (type === "camera") {
      const videoTrack = stream.getVideoTracks()[0];
      //const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        const producer = await transport.produce({ track: videoTrack, appData: { type } });
        newProducers.camera = producer;
      }

      /*if (audioTrack) {
        const producer = await transport.produce({ track: audioTrack, appData: { type } });
      }*/

      setCameraStream(stream);
      setCamEnabled(true);
    } else {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const producer = await transport.produce({ track: videoTrack, appData: { type } });
        newProducers.screen = producer;
      }

      setScreenStream(stream);

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("[Media] 화면 공유 종료됨");
        stopMedia("screen");
        stopMedia("camera");
      });
    }

    // producer 저장
    setMyProducers((prev) => ({ ...prev, ...newProducers }));

    // 로컬 화면 연결
    if (localVideoRef.current) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const onlyVideoStream = new MediaStream([videoTrack]);
        localVideoRef.current.srcObject = onlyVideoStream;
      }
    }
  };

  //마이크 시작
  const startMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = stream.getAudioTracks()[0];
    const transport = sendTransportRef.current ?? await createSendTransport();
    const producer = await transport.produce({
      track: audioTrack,
      appData: { type: "mic" },
    });
    setMyProducers((prev) => ({ ...prev, mic: producer }));
    setMicStream(stream);
    setMicEnabled(true);
  };

  //마이크 종료
  const stopMic = async () => {
    console.log("[Media] 마이크 종료");

    //트랙 종료
    micStream?.getTracks().forEach((t) => t.stop());

    // producer 종료
    const producer = myProducers["mic"];
    if (producer) {
      producer.close();
      socketRef.current?.emit("close-producer", producer.id);
      setMyProducers((prev) => ({ ...prev, mic: undefined }));
    }

    //상태 초기화
    setMicStream(null);
    setMicEnabled(false);

    // 다른 producer가 없다면 transport 정리
    const remaining = Object.entries(myProducers)
      .filter(([type, p]) => type !== "mic" && p)
      .length;

    if (remaining === 0) {
      sendTransportRef.current?.close();
      sendTransportRef.current = null;
    }

  }



  // 미디어 종료
  const stopMedia = (type: StreamType) => {
    console.log(`[Media] ${type} 종료`);
    const stream = type === "camera" ? cameraStream : screenStream;

    // 트랙 종료
    stream?.getTracks().forEach((t) => t.stop());

    // producer 종료
    const producer = myProducers[type];
    if (producer) {
      producer.close();
      socketRef.current?.emit("close-producer", producer.id);
      setMyProducers((prev) => ({ ...prev, [type]: undefined }));
    }

    // stream 상태 초기화
    if (type === "camera") {
      setCameraStream(null);
      setCamEnabled(false);
    } else {
      setScreenStream(null);
    }

    // 비디오 ref도 해제


    // 모든 producer 종료 시 transport 제거
    const remaining = Object.values(myProducers).filter(Boolean).length;
    if (remaining === 0) {
      sendTransportRef.current?.close();
      sendTransportRef.current = null;
    }
  };

  const stopOppositeMedia = (type: StreamType) => {
    if (type === "camera" && screenStream) {
      stopMedia("screen");
    } else if (type === "screen" && cameraStream) {
      stopMedia("camera");
    }
  }


  const toggleCamera = () => {
    console.log("[UI] 카메라 토글");
    cameraStream ? stopMedia("camera") : startMedia("camera");
  };

  const toggleScreen = () => {
    console.log("[UI] 화면공유 토글");
    screenStream ? stopMedia("screen") : startMedia("screen");
  };

  const toggleMic = async () => {
    if (micEnabled) {
      stopMic();
    } else {
      await startMic();
    }
  };

  // 기록 버튼 핸들러
  const handleRecord = async () => {
    if (!recording) {
      // 녹음 시작
      if (!micStream) {
        alert("마이크가 켜져 있어야 녹음이 가능합니다.");
        return;
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(micStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } else {
      // 녹음 중지
      setRecording(false);
      setProcessing(true); // 주황색으로 즉시 전환
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current!.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setPendingAudio(audioBlob); // 실제 처리는 useEffect에서!
      };
    }
  };

  // 처리 중 상태에서 실제 STT/요약 처리 시작
  useEffect(() => {
    if (processing && pendingAudio && !isHandledRef.current) {
      isHandledRef.current = true;
      (async () => {
        const reader = new FileReader();
        reader.readAsDataURL(pendingAudio);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            // 1. STT 변환
            const sttRes = await fetch("/api/stt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioContent: base64Audio }),
            });
            if (!sttRes.ok) throw new Error('STT 변환 실패');
            const sttData = await sttRes.json();
            if (!sttData.transcript) throw new Error('음성 인식 결과가 없습니다.');

            // 2. 요약 생성
            const summaryRes = await fetch("/api/summary", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: sttData.transcript }),
            });
            if (!summaryRes.ok) throw new Error('요약 생성 실패');
            const summaryData = await summaryRes.json();
            const summary = summaryData.summary || "요약 생성 실패";

            // 3. 문서 제목 및 본문 생성
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hour = String(now.getHours()).padStart(2, '0');
            const minute = String(now.getMinutes()).padStart(2, '0');
            const title = `${year}-${month}-${day} ${hour}:${minute} 통화 녹음`;
            const content = JSON.stringify([
              {
                id: "1",
                type: "paragraph",
                props: {},
                content: [
                  {
                    type: "text",
                    text: summary,
                    styles: {}
                  }
                ]
              },
              {
                id: "2",
                type: "paragraph",
                props: {},
                content: [
                  {
                    type: "text",
                    text: "---",
                    styles: {}
                  }
                ]
              },
              {
                id: "3",
                type: "paragraph",
                props: {},
                content: [
                  {
                    type: "text",
                    text: sttData.transcript,
                    styles: {}
                  }
                ]
              }
            ]);

            // 4. workspaceId 추출
            let workspaceId = params.workspaceId;
            if (Array.isArray(workspaceId)) workspaceId = workspaceId[0];
            if (!workspaceId || typeof workspaceId !== 'string') throw new Error('워크스페이스 ID를 찾을 수 없습니다.');

            // 5. "통화 녹음" 부모 문서 찾기 또는 생성
            const parentTitle = "통화 녹음";
            const existingParentDoc = getSidebar?.find(doc => doc.title === parentTitle);

            let parentDocId;
            if (!existingParentDoc) {
              // 부모 문서가 없으면 생성
              const newParentDoc = await createDocument({
                title: parentTitle,
                workspaceId,
              });
              parentDocId = newParentDoc;
            } else {
              parentDocId = existingParentDoc._id;
            }

            // 6. 녹음 내용을 하위 문서로 생성
            const documentId = await createDocument({
              title,
              workspaceId,
              parentDocument: parentDocId,
              content,
            });

            // 7. 새로 생성된 문서 페이지로 이동
            router.push(`/workspace/${workspaceId}/documents/${documentId}`);
          } catch (error) {
            console.error('오디오 처리 중 오류:', error);
            alert('오디오 처리 중 오류가 발생했습니다.');
          } finally {
            setProcessing(false);
            setPendingAudio(null);
            isHandledRef.current = false;
          }
        };
      })();
    }
  }, [processing, pendingAudio, getSidebar]);

  // 버튼 색상 결정
  let buttonColor = "bg-black";
  if (processing) buttonColor = "bg-orange-500";
  else if (recording) buttonColor = "bg-red-600";

  return (
    <div className="p-4 space-y-4">
      <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
        <div
          ref={remoteContainerRef}
          className="absolute top-0 left-0 w-full h-full flex flex-wrap justify-center items-center gap-2"
        />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`absolute ${hasRemoteScreenShare ? "w-1/4 bottom-4 right-4" : "w-full h-full"} object-cover border border-white rounded`}
        />

      </div>
      <div className="flex justify-center gap-4">
        <Button onClick={toggleCamera}>{camEnabled ? <VideoOff /> : <Video />}</Button>
        <Button onClick={toggleScreen}>{screenStream ? <ScreenShareOff /> : <ScreenShare />}</Button>
        <Button onClick={toggleMic}>
          {micEnabled ? (
            <>
              <MicOff className="mr-1" />
            </>
          ) : (
            <>
              <Mic className="mr-1" />
            </>
          )}
        </Button>
        <Button onClick={handleRecord} className={buttonColor} variant={recording ? "destructive" : "default"}>
          {processing
            ? "처리 중..."
            : recording
              ? "기록 중지"
              : <NotebookPen />}
        </Button>
      </div>
    </div>
  );
}
