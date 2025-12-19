import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import CallModal from "./callModal"; // 이걸 내부에 렌더링할 것

interface CallSettings {
    mic: boolean;
    cam: boolean;
    screen: boolean;
}

interface CallPreJoinModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
}

const CallPreJoinModal: React.FC<CallPreJoinModalProps> = ({ isOpen, onClose, roomId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [camEnabled, setCamEnabled] = useState(false);
    const [micEnabled, setMicEnabled] = useState(false);
    const [screenEnabled] = useState(false); // screen은 추후 버튼 추가 가능
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [joined, setJoined] = useState(false); // 참여 버튼 누른 상태
    const [callSettings, setCallSettings] = useState<CallSettings | null>(null);

    const handleClose = () => {
        previewStream?.getTracks().forEach((track) => track.stop());
        setPreviewStream(null);
        setJoined(false);
        setCallSettings(null);
        onClose();
    };

    useEffect(() => {
        if (!isOpen || (!camEnabled && !micEnabled)) return; // 아무것도 켜지 않은 상태면 skip

        const getPreview = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: camEnabled,
                    audio: micEnabled
                });
                setPreviewStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("장치 점유 중이거나 접근 실패", err);
            }
        };

        getPreview();
        return () => {
            previewStream?.getTracks().forEach((track) => track.stop());
        };
    }, [isOpen, camEnabled, micEnabled]);


    const toggleCam = () => {
        if (!previewStream) return;
        previewStream.getVideoTracks().forEach((track) => (track.enabled = !camEnabled));
        setCamEnabled((prev) => !prev);
    };

    const toggleMic = () => {
        if (!previewStream) return;
        previewStream.getAudioTracks().forEach((track) => (track.enabled = !micEnabled));
        setMicEnabled((prev) => !prev);
    };

    const handleJoin = () => {
        setCallSettings({ mic: micEnabled, cam: camEnabled, screen: screenEnabled });
        setJoined(true);
    };

    if (!isOpen) return null;

    // 참여 후에는 CallModal을 보여줌
    if (joined && callSettings && previewStream) {
        return (
            <CallModal
                isOpen={true}
                onClose={handleClose}
                roomId={roomId}
            //settings={callSettings}
            //stream={previewStream}
            />
        );
    }

    // 초기 프리뷰 화면
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="rounded-lg p-6 w-5/12 h-auto border bg-white dark:bg-neutral-900 space-y-4">
                <h2 className="text-xl font-bold">통화 참여 전에 확인하세요</h2>
                <div className="aspect-video bg-black rounded overflow-hidden relative">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    {!camEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-60">
                            카메라 꺼짐
                        </div>
                    )}
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={toggleCam}>{camEnabled ? <Video /> : <VideoOff />}</Button>
                    <Button onClick={toggleMic}>{micEnabled ? <Mic /> : <MicOff />}</Button>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        닫기
                    </Button>
                    <Button onClick={handleJoin}>참여하기</Button>
                </div>
            </div>
        </div>
    );
};

export default CallPreJoinModal;
