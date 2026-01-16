"use client";

import { useMediasoup, RemoteStreamInfo } from "@/hooks/use-mediasoup";
import { useRecorderAi } from "@/hooks/use-recorder-ai";
import { useEffect, useRef, useState, useMemo, JSX } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  ScreenShareOff,
  NotebookPen
} from "lucide-react";

// [AI 리뷰 반영] 컴포넌트 리턴 타입 JSX.Element 명시 및 접근성 고려
function RemoteVideo({ info, className }: { info: RemoteStreamInfo; className?: string }): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && info.stream) {
      videoRef.current.srcObject = info.stream;
    }
  }, [info.stream]);
  return <video ref={videoRef} autoPlay playsInline className={className} title="Remote participant video" />;
}

function LocalVideo({ stream, className, muted = true }: { stream: MediaStream | null, className?: string, muted?: boolean }): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay muted={muted} playsInline className={className} title="My video preview" />;
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

  const [pinnedProducerId, setPinnedProducerId] = useState<string | "local">("");

  /**
   * [ESLint 경고 해결] 
   * 파생 변수인 myVideoStream을 useMemo 내부로 옮겨 중복 의존성 제거 및 Linter 만족
   */
  const mainStream = useMemo(() => {
    const currentMyStream = streams.screen || streams.camera;

    if (pinnedProducerId === "local") return { stream: currentMyStream, type: "local" };
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
  }, [pinnedProducerId, remoteStreams, streams.screen, streams.camera]);

  const mainId = useMemo(() => {
    if (!mainStream) return null;
    if ("producerId" in mainStream) return mainStream.producerId;
    return "local";
  }, [mainStream]);

  // 하단 썸네일 노출 로직
  const currentMyStream = streams.screen || streams.camera;
  const thumbnails = remoteStreams.filter(s => s.producerId !== mainId);
  const showLocalInThumb = mainId !== "local" && !!currentMyStream;
  const showThumbnailStrip = thumbnails.length > 0 || showLocalInThumb;

  const isEmptyMain = !mainStream;

  // AI 기록 버튼 상태별 스타일
  const recordBtnStyles = useMemo(() => {
    if (processing) return { color: "bg-orange-500", label: "요약 중..." };
    if (recording) return { color: "bg-red-600 animate-pulse", label: "기록 중지" };
    return { color: "bg-black", label: "AI 기록 시작" };
  }, [processing, recording]);

  return (
    <div className={`relative w-full h-full rounded-md md:rounded-2xl overflow-hidden bg-neutral-950 flex flex-col items-center justify-center transition-all duration-500 ${isEmptyMain && !isFullScreen ? "aspect-video min-h-[400px]" : "h-full"
      } border border-white/5 shadow-2xl`}>

      {/* 메인 뷰 영역 */}
      <div className="flex-1 min-h-0 w-full bg-black relative flex items-center justify-center overflow-hidden">
        {mainStream ? (
          <div className="w-full h-full relative group justify-center items-center flex">
            {"producerId" in mainStream ? (
              <RemoteVideo info={mainStream as RemoteStreamInfo} className="max-w-full max-h-full w-auto h-auto object-contain" />
            ) : (
              <LocalVideo stream={currentMyStream} className="max-w-full max-h-full w-auto h-auto object-contain" />
            )}

            {pinnedProducerId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPinnedProducerId("")}
                className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-black/60 transition-opacity opacity-0 group-hover:opacity-100"
              >
                고정 해제
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-neutral-600">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full" />
              <div className="relative w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center border border-white/5">
                <Video className="w-12 h-12 opacity-30" />
              </div>
            </div>
            <div className="text-center px-6">
              <h3 className="text-lg font-semibold text-neutral-400">대화 준비 중</h3>
              <p className="text-sm opacity-50 mt-1">카메라나 화면 공유를 켜고 소통을 시작해보세요.</p>
            </div>
          </div>
        )}
      </div>

      {/* 썸네일 스트립 - 접근성 강화 (role, tabIndex 추가) */}
      {showThumbnailStrip && (
        <div className="flex items-center gap-3 overflow-x-auto py-3 px-4 h-40 scrollbar-hide shrink-0 w-full bg-neutral-900/50 backdrop-blur-sm border-t border-white/5">
          {showLocalInThumb && (
            <div
              role="button"
              tabIndex={0}
              aria-label="내 화면 고정하기"
              onClick={() => setPinnedProducerId("local")}
              onKeyDown={(e) => e.key === 'Enter' && setPinnedProducerId("local")}
              className="relative flex-shrink-0 w-48 aspect-video bg-neutral-800 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500/50 cursor-pointer shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <LocalVideo stream={currentMyStream} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white border border-white/10">나</div>
            </div>
          )}

          {thumbnails.map((info) => (
            <div
              key={info.producerId}
              role="button"
              tabIndex={0}
              aria-label="참여자 화면 고정하기"
              onClick={() => setPinnedProducerId(info.producerId)}
              onKeyDown={(e) => e.key === 'Enter' && setPinnedProducerId(info.producerId)}
              className="relative flex-shrink-0 w-48 aspect-video bg-neutral-800 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/50 cursor-pointer group transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <RemoteVideo info={info} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white border border-white/10">참여자</div>
            </div>
          ))}
        </div>
      )}

      {/* 컨트롤 바 영역 */}
      <div className="flex justify-center items-center gap-4 w-full py-2 md:py-4 bg-neutral-900/80 border-t border-white/5 backdrop-blur-md box-border">
        <div className="flex items-center gap-4 px-6 py-2 rounded-2xl">
          <Button
            variant={camEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleCamera}
            className="rounded-full  md:w-12 md:h-12 shadow-lg transition-transform active:scale-95"
            aria-label={camEnabled ? "카메라 끄기" : "카메라 켜기"}
          >
            {camEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>

          <Button
            variant={streams.screen ? "default" : "outline"}
            size="icon"
            onClick={toggleScreen}
            className="rounded-full  md:w-12 md:h-12 shadow-lg transition-transform active:scale-95"
            aria-label={streams.screen ? "화면 공유 중지" : "화면 공유 시작"}
          >
            {streams.screen ? <ScreenShareOff className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
          </Button>

          <Button
            variant={micEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleMic}
            className="rounded-full  md:w-12 md:h-12 shadow-lg transition-transform active:scale-95"
            aria-label={micEnabled ? "마이크 끄기" : "마이크 켜기"}
          >
            {micEnabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <div className="w-[1px] h-8 bg-white/10 mx-2" aria-hidden="true" />

          <Button
            onClick={handleRecord}
            disabled={processing}
            className={`rounded-full px-6 md:h-12 text-white font-semibold transition-all shadow-xl hover:scale-105 active:scale-95 ${recordBtnStyles.color}`}
          >
            {processing ? (
              <span className="flex items-center gap-2">요약 중...</span>
            ) : (
              <span className="flex items-center gap-2">
                <NotebookPen className="w-4 h-4" />
                {recordBtnStyles.label}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}