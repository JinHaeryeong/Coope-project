import { Button } from "@/components/ui/button";
import React, { useRef, useState } from "react";
import WebRTCComponent from "./WebRtcComponent"; // WebRTC 추가
import { Expand, Minus, PhoneOff, X } from "lucide-react";
import Draggable from "react-draggable";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}


const CallModal: React.FC<ModalProps> = ({ isOpen, onClose, roomId }) => {
  const [minimized, setMinimized] = useState(false);
  const draggableRef = useRef<HTMLDivElement>(null);
  const [remotePreviewStream, setRemotePreviewStream] = useState<MediaStream | null>(null);

  if (!isOpen && !minimized) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 ${minimized ? "hidden" : "flex items-center justify-center bg-black bg-opacity-50"}`}
      >
        <div className="rounded-lg p-6 w-5/12 h-auto border bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-bold">통화</h2>
          <WebRTCComponent roomId={roomId} onRemoteVideoStream={setRemotePreviewStream} />
          <Button variant="ghost" className="mt-4 ml-2 mr-1 px-2 py-2 rounded" onClick={() => setMinimized(true)}><Minus /></Button>
          <Button variant="outline" className="mt-4 px-2 py-2 rounded" onClick={onClose}><X /></Button>
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
