"use client";

import { useMediasoup, RemoteStreamInfo } from "@/hooks/use-mediasoup";
import { useRecorderAi } from "@/hooks/use-recorder-ai";
import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  ScreenShareOff,
} from "lucide-react";

// 원격 스트림 컴포넌트
function RemoteVideo({ info, className }: { info: RemoteStreamInfo; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && info.stream) {
      videoRef.current.srcObject = info.stream;
    }
  }, [info.stream]);
  return <video ref={videoRef} autoPlay playsInline className={className} />;
}

// 로컬 스트림 컴포넌트
function LocalVideo({ stream, className, muted = true }: { stream: MediaStream | null, className?: string, muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay muted={muted} playsInline className={className} />;
}

export default function WebRtcComponent({ roomId, isFullScreen }: { roomId: string; isFullScreen?: boolean }) {
  const {
    streams,
    remoteStreams,
    camEnabled,
    micEnabled,
    toggleCamera,
    toggleScreen,
    toggleMic,
  } = useMediasoup(roomId);

  const { recording, processing, handleRecord } = useRecorderAi(streams.mic);

  // --- 핀(Pin) 기능 상태 추가 ---
  const [pinnedProducerId, setPinnedProducerId] = useState<string | "local">("");

  const myVideoStream = streams.screen || streams.camera;

  /**
   * 메인 스트림 결정 로직 (우선순위)
   * 1. 사용자가 클릭해서 핀으로 고정한 스트림
   * 2. 상대방 화면 공유
   * 3. 나의 화면 공유
   * 4. 상대방 카메라
   * 5. 나의 카메라
   */
  const mainStream = useMemo(() => {
    if (pinnedProducerId === "local") return { stream: myVideoStream, type: "local" };
    if (pinnedProducerId) {
      const pinned = remoteStreams.find(s => s.producerId === pinnedProducerId);
      if (pinned) return pinned;
    }

    return (
      remoteStreams.find((s) => s.type === "screen") ||
      (streams.screen ? { stream: streams.screen, type: "screen" } : null) ||
      remoteStreams.find((s) => s.type === "camera") ||
      (streams.camera ? { stream: streams.camera, type: "camera" } : null)
    );
  }, [pinnedProducerId, remoteStreams, streams.screen, streams.camera, myVideoStream]);

  // 메인에 나오고 있는 스트림의 ID (비교용)
  const mainId = useMemo(() => {
    if (!mainStream) return null;

    // RemoteStreamInfo 타입인 경우 (producerId 속성이 있음)
    if ("producerId" in mainStream) {
      return mainStream.producerId;
    }

    // 로컬 스트림인 경우
    return "local";
  }, [mainStream]);

  // 하단 썸네일 리스트 (메인에 표시 중인 것 제외)
  const thumbnails = remoteStreams.filter(s => s.producerId !== mainId);
  const showLocalInThumb = mainId !== "local" && !!myVideoStream;
  const showThumbnailStrip = thumbnails.length > 0 || showLocalInThumb;

  // 메인 영역에 표시할 내용이 아예 없는지 확인
  const isEmptyMain = !mainStream;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center transition-all duration-500 ${
      // 아무것도 없을 때(isEmptyMain) 최소 높이와 비율을 강제함
      isEmptyMain && !isFullScreen ? "aspect-video min-h-[400px]" : "h-full"
      } border border-white/5`}>

      {/* 1. MAIN VIEW AREA */}
      <div className="flex-1 min-h-0 bg-black rounded-2xl overflow-hidden relative border border-white/5 shadow-2xl flex items-center justify-center">
        {mainStream ? (
          <div className="w-full h-full relative">
            {"producerId" in mainStream ? (
              <RemoteVideo info={mainStream as RemoteStreamInfo} className="w-full h-full object-contain" />
            ) : (
              <LocalVideo stream={myVideoStream} className="w-full h-full object-contain" />
            )}
            {/* 핀 해제 버튼 (수동으로 핀을 박았을 때만 노출) */}
            {pinnedProducerId && (
              <button
                onClick={() => setPinnedProducerId("")}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition-all"
              >
                고정 해제
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-neutral-500 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center border border-white/5">
              <Video className="w-10 h-10 opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-neutral-400">연결 대기 중</p>
              <p className="text-sm opacity-60">카메라나 화면 공유를 시작하여 대화를 시작하세요.</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. THUMBNAIL STRIP (클릭 시 핀 설정 추가) */}
      {showThumbnailStrip && (
        <div className="flex items-center gap-3 overflow-x-auto py-2 h-36 scrollbar-hide shrink-0 transition-all">
          {/* 내 썸네일 */}
          {showLocalInThumb && (
            <div
              onClick={() => setPinnedProducerId("local")}
              className="relative flex-shrink-0 w-48 aspect-video bg-neutral-900 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer shadow-lg transition-all"
            >
              <LocalVideo stream={myVideoStream} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">나</div>
            </div>
          )}

          {/* 타인 썸네일 목록 */}
          {thumbnails.map((info) => (
            <div
              key={info.producerId}
              onClick={() => setPinnedProducerId(info.producerId)}
              className="relative flex-shrink-0 w-48 aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500 cursor-pointer group transition-all"
            >
              <RemoteVideo info={info} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">참여자</div>
            </div>
          ))}
        </div>
      )}

      {/* 3. CONTROL AREA */}
      <div className={`flex justify-center items-center gap-4 shrink-0 ${showThumbnailStrip ? "pb-2" : "pt-2 pb-2"}`}>
        <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
          <Button variant={camEnabled ? "default" : "outline"} size="icon" onClick={toggleCamera} className="rounded-full w-12 h-12">
            {camEnabled ? <VideoOff /> : <Video />}
          </Button>
          <Button variant={streams.screen ? "default" : "outline"} size="icon" onClick={toggleScreen} className="rounded-full w-12 h-12">
            {streams.screen ? <ScreenShareOff /> : <ScreenShare />}
          </Button>
          <Button variant={micEnabled ? "default" : "outline"} size="icon" onClick={toggleMic} className="rounded-full w-12 h-12">
            {micEnabled ? <MicOff /> : <Mic />}
          </Button>
          <div className="w-[1px] h-8 bg-white/10 mx-2" />
          <Button onClick={handleRecord} disabled={processing} className={`rounded-full px-6 h-12 text-white font-semibold transition-all shadow-lg ${processing ? "bg-orange-500" : recording ? "bg-red-600" : "bg-black"}`}>
            {processing ? "요약 중" : recording ? "기록 중지" : "AI 기록 시작"}
          </Button>
        </div>
      </div>
    </div>
  );
}