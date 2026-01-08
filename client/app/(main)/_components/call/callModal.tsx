import { Button } from "@/components/ui/button";
import React, { useRef, useState } from "react";
import WebRTCComponent from "./WebRtcComponent"; // WebRTC 추가
import { Expand, Minus, PhoneOff, Square, SquareArrowOutDownLeft, X } from "lucide-react";
import Draggable from "react-draggable";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}


const CallModal: React.FC<ModalProps> = ({ isOpen, onClose, roomId }) => {
  const [minimized, setMinimized] = useState(false); // 최소화 상태 관리
  const [isFullScreen, setIsFullScreen] = useState(false); // 전체화면 상태 관리
  const draggableRef = useRef<HTMLDivElement>(null);
  const [remotePreviewStream, setRemotePreviewStream] = useState<MediaStream | null>(null);

  if (!isOpen && !minimized) return null;

  return (
    <>
      <div
        className={`
          fixed inset-0 z-[99999] transition-all duration-300
          ${minimized ? "hidden" : "flex items-center justify-center bg-black/60 backdrop-blur-sm"}
        `}
      >
        <div
          className={`
            relative transition-all duration-300 border bg-white dark:bg-neutral-900 shadow-2xl
            ${isFullScreen
              ? "w-screen h-screen rounded-none p-10" // 전체 화면 모드
              : "w-11/12 md:w-8/12 lg:w-5/12 h-auto rounded-2xl p-6" // 기본 모달 모드
            }
          `}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">통화</h2>
          </div>

          <div className={`${isFullScreen ? "h-[calc(100%-80px)]" : "h-auto"}`}>
            <WebRTCComponent
              roomId={roomId}
              onRemoteVideoStream={setRemotePreviewStream}
              isFullScreen={isFullScreen}
            />
          </div>

          <div className="text-right space-x-2 mt-4">
            <Button variant="ghost" size="icon" onClick={() => setMinimized(true)}>
              <Minus />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
              {isFullScreen ? <SquareArrowOutDownLeft /> : <Square />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X />
            </Button>
          </div>
        </div>
      </div>

      {minimized && (
        <Draggable nodeRef={draggableRef as React.RefObject<HTMLElement>}>
          <div ref={draggableRef} className="fixed bottom-4 right-4 z-50 bg-neutral-900 text-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-3">
            {remotePreviewStream && <video autoPlay playsInline muted className="w-24 h-16 rounded" ref={(el) => { if (el) el.srcObject = remotePreviewStream }} />}
            <span className="text-sm">통화 중...</span>
            <Button size="icon" variant="ghost" onClick={() => setMinimized(false)}><Expand /></Button>
            <Button size="icon" variant="ghost" onClick={() => {
              setMinimized(false);
              onClose();
            }}><PhoneOff /></Button>
          </div>
        </Draggable>
      )}
    </>
  );

};

export default CallModal;
