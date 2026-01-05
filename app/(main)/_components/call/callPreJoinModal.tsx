"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import CallModal from "./callModal";

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
    const [screenEnabled] = useState(false);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [joined, setJoined] = useState(false);
    const [callSettings, setCallSettings] = useState<CallSettings | null>(null);

    // 모달 닫기 및 리소스 정리
    const handleClose = () => {
        if (previewStream) {
            previewStream.getTracks().forEach((track) => track.stop());
        }
        setPreviewStream(null);
        setJoined(false);
        setCallSettings(null);
        onClose();
    };

    useEffect(() => {
        // 모달이 닫혀있거나 장치가 모두 꺼져있으면 스트림 정리 후 종료
        if (!isOpen || (!camEnabled && !micEnabled)) {
            if (previewStream) {
                previewStream.getTracks().forEach((track) => track.stop());
                setPreviewStream(null);
            }
            return;
        }

        const getPreview = async () => {
            try {
                // 새로운 스트림을 받기 전에 기존 스트림이 있다면 미리 정지
                if (previewStream) {
                    previewStream.getTracks().forEach((track) => track.stop());
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: camEnabled,
                    audio: micEnabled,
                });

                setPreviewStream(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    if (err.name === "NotAllowedError") {
                        console.error("카메라/마이크 권한이 거부되었습니다.");
                        alert("카메라 및 마이크 접근 권한을 허용해주세요.");
                    } else if (err.name === "NotFoundError") {
                        console.error("연결된 장치를 찾을 수 없습니다.");
                    } else {
                        console.error("장치 연결 중 오류 발생:", err.message);
                    }
                }
            }
        };

        getPreview();

        // 정리(Cleanup) 함수: 컴포넌트 언마운트 시 트랙 정지
        return () => {
            previewStream?.getTracks().forEach((track) => track.stop());
        };
        // 의존성 배열에 필요한 모든 값 포함 (Warning 해결)
    }, [isOpen, camEnabled, micEnabled, previewStream]);

    const toggleCam = () => {
        setCamEnabled((prev) => !prev);
    };

    const toggleMic = () => {
        setMicEnabled((prev) => !prev);
    };

    const handleJoin = () => {
        setCallSettings({ mic: micEnabled, cam: camEnabled, screen: screenEnabled });
        setJoined(true);
    };

    if (!isOpen) return null;

    if (joined && callSettings && previewStream) {
        return (
            <CallModal
                isOpen={true}
                onClose={handleClose}
                roomId={roomId}
            // settings={callSettings}
            // stream={previewStream}
            />
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="rounded-lg p-6 w-11/12 max-w-2xl h-auto border bg-white dark:bg-neutral-900 space-y-4">
                <h2 className="text-xl font-bold">통화 참여 전 확인</h2>
                <div className="aspect-video bg-black rounded overflow-hidden relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {!camEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-60">
                            카메라가 꺼져 있습니다
                        </div>
                    )}
                </div>
                <div className="flex justify-center gap-4">
                    <Button
                        variant={camEnabled ? "default" : "destructive"}
                        onClick={toggleCam}
                    >
                        {camEnabled ? <Video /> : <VideoOff />}
                    </Button>
                    <Button
                        variant={micEnabled ? "default" : "destructive"}
                        onClick={toggleMic}
                    >
                        {micEnabled ? <Mic /> : <MicOff />}
                    </Button>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={handleClose}>
                        취소
                    </Button>
                    <Button onClick={handleJoin} disabled={!previewStream && (camEnabled || micEnabled)}>
                        참여하기
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CallPreJoinModal;