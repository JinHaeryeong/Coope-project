"use client";

import { useMediasoup } from "@/hooks/use-mediasoup";
import { useRecorderAi } from "@/hooks/use-recorder-ai";
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

interface WebRtcProps {
  roomId: string;
  onRemoteVideoStream?: (stream: MediaStream) => void;
  isFullScreen?: boolean;
}

export default function WebRtcComponent({ roomId, onRemoteVideoStream, isFullScreen }: WebRtcProps) {
  // WebRTC 통신 관련 로직 가져오기
  const {
    streams,
    camEnabled,
    micEnabled,
    hasRemoteScreenShare,
    localVideoRef,
    remoteContainerRef,
    toggleCamera,
    toggleScreen,
    toggleMic
  } = useMediasoup(roomId, onRemoteVideoStream);

  // 녹음 및 AI 요약 로직 가져오기 (마이크 스트림 전달)
  const {
    recording,
    processing,
    handleRecord
  } = useRecorderAi(streams.mic);

  // 버튼 배경색 결정 로직
  const getRecordButtonColor = () => {
    if (processing) return "bg-orange-500 hover:bg-orange-600 text-white";
    if (recording) return "bg-red-600 hover:bg-red-700 text-white";
    return "bg-black hover:bg-neutral-800 text-white";
  };

  return (
    <div className={`flex flex-col w-full transition-all duration-300 ${isFullScreen ? "h-full p-0" : "h-auto p-4 space-y-4"
      }`}>
      {/* 비디오 렌더링 영역 */}
      <div className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${isFullScreen ? "flex-1" : "aspect-video"
        }`}>
        {/* 상대방 비디오들이 들어가는 컨테이너 */}
        <div
          ref={remoteContainerRef}
          className="absolute top-0 left-0 w-full flex flex-wrap justify-center items-center gap-2 p-2 z-0"
        />

        {/* 내 로컬 비디오 (상대방 화면공유 시 우측 하단으로 작아짐) */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`absolute transition-all duration-300 shadow-md object-cover border-2 border-white/20 rounded-lg bg-neutral-900 ${hasRemoteScreenShare || isFullScreen
            ? "w-1/4 bottom-4 right-4 z-10" // 공유 중이거나 전체화면이면 작게 유지
            : "w-full h-full z-0"
            }`}
        />
      </div>

      {/* 컨트롤 버튼 영역 */}
      <div className={`flex justify-center items-center gap-4 ${isFullScreen ? "py-6" : ""
        }`}>
        {/* 카메라 토글 */}
        <Button
          variant={camEnabled ? "default" : "outline"}
          size="icon"
          onClick={toggleCamera}
          className="rounded-full w-12 h-12"
        >
          {camEnabled ? <VideoOff /> : <Video />}
        </Button>

        {/* 화면 공유 토글 */}
        <Button
          variant={streams.screen ? "default" : "outline"}
          size="icon"
          onClick={toggleScreen}
          className="rounded-full w-12 h-12"
        >
          {streams.screen ? <ScreenShareOff /> : <ScreenShare />}
        </Button>

        {/* 마이크 토글 */}
        <Button
          variant={micEnabled ? "default" : "outline"}
          size="icon"
          onClick={toggleMic}
          className="rounded-full w-12 h-12"
        >
          {micEnabled ? <MicOff /> : <Mic />}
        </Button>

        {/* AI 기록 및 요약 버튼 */}
        <Button
          onClick={handleRecord}
          disabled={processing}
          className={`rounded-full px-6 h-12 font-medium transition-colors ${getRecordButtonColor()}`}
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin text-lg">⏳</span>
              요약 생성 중...
            </span>
          ) : recording ? (
            "기록 중지"
          ) : (
            <>
              <NotebookPen className="mr-2 w-5 h-5" />
              AI 기록 시작
            </>
          )}
        </Button>
      </div>
    </div>
  );
}