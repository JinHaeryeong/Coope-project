"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useParams } from "next/navigation";

export const useRecorderAi = (micStream: MediaStream | null) => {
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pendingAudio, setPendingAudio] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isHandledRef = useRef(false);

    const createDocument = useMutation(api.documents.create);
    const router = useRouter();
    const params = useParams();

    // 사이드바 목록을 가져와서 "통화 녹음" 부모 폴더가 있는지 확인용
    const getSidebar = useQuery(api.documents.getSidebar, {
        workspaceId: params.workspaceId as string,
        parentDocument: undefined
    });

    // 녹음 시작/중지 핸들러
    const handleRecord = async () => {
        if (!recording) {
            if (!micStream) {
                alert("마이크가 켜져 있어야 녹음이 가능합니다.");
                return;
            }
            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(micStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                setPendingAudio(audioBlob);
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setRecording(true);
        } else {
            setRecording(false);
            setProcessing(true); // 중지 즉시 처리 중 상태로 변경
            mediaRecorderRef.current?.stop();
        }
    };

    // 녹음 완료 후 AI 처리 (STT -> 요약 -> 문서 생성)
    useEffect(() => {
        const processAudio = async () => {
            if (!processing || !pendingAudio || isHandledRef.current) return;

            isHandledRef.current = true;

            try {
                // Blob을 Base64로 변환
                const base64Audio = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(pendingAudio);
                    reader.onloadend = () => resolve(reader.result as string);
                });

                // STT 변환 API 호출
                const sttRes = await fetch("/api/stt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ audioContent: base64Audio }),
                });
                if (!sttRes.ok) throw new Error('STT 변환 실패');
                const sttData = await sttRes.json();
                if (!sttData.transcript) throw new Error('음성 인식 결과가 없습니다.');

                // 요약 생성 API 호출
                const summaryRes = await fetch("/api/summary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: sttData.transcript }),
                });
                if (!summaryRes.ok) throw new Error('요약 생성 실패');
                const summaryData = await summaryRes.json();
                const summary = summaryData.summary || "요약 생성 실패";

                // 문서 데이터 구성 (BlockNote 포맷 등 프로젝트 규격에 맞게)
                const now = new Date();
                const title = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 통화 녹음`;

                const content = JSON.stringify([
                    { id: "1", type: "paragraph", content: [{ type: "text", text: "AI 요약 내용:", styles: { bold: true } }] },
                    { id: "2", type: "paragraph", content: [{ type: "text", text: summary, styles: {} }] },
                    { id: "3", type: "paragraph", content: [{ type: "text", text: "---", styles: {} }] },
                    { id: "4", type: "paragraph", content: [{ type: "text", text: "전체 스크립트:", styles: { bold: true } }] },
                    { id: "5", type: "paragraph", content: [{ type: "text", text: sttData.transcript, styles: {} }] }
                ]);

                const workspaceId = params.workspaceId as string;

                // "통화 녹음" 부모 문서(폴더) 찾기 또는 생성
                const parentTitle = "통화 녹음";
                const existingParentDoc = getSidebar?.find(doc => doc.title === parentTitle);
                let parentDocId = existingParentDoc?._id;

                if (!existingParentDoc) {
                    parentDocId = await createDocument({
                        title: parentTitle,
                        workspaceId,
                    });
                }

                // 최종 문서 생성
                const documentId = await createDocument({
                    title,
                    workspaceId,
                    parentDocument: parentDocId,
                    content,
                });

                // 생성된 페이지로 이동
                router.push(`/workspace/${workspaceId}/documents/${documentId}`);

            } catch (error) {
                console.error('AI 처리 중 오류:', error);
                alert('오디오 처리 중 오류가 발생했습니다.');
            } finally {
                setProcessing(false);
                setPendingAudio(null);
                isHandledRef.current = false;
            }
        };

        processAudio();
    }, [processing, pendingAudio, getSidebar, params.workspaceId, createDocument, router]);

    return {
        recording,
        processing,
        handleRecord
    };
};