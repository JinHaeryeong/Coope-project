import { useEffect, useRef, useCallback } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { debounce } from "lodash";

interface UseEditorSyncProps {
    editor: BlockNoteEditor;
    initialContent?: string;
    onChange: (value: string) => void;
}

export const useEditorSync = ({
    editor,
    initialContent,
    onChange,
}: UseEditorSyncProps) => {
    const isSelfUpdating = useRef(false);
    const lastPushedContent = useRef(initialContent); // 내가 마지막으로 서버에 보낸 내용 기록

    // 1. 서버 -> 에디터 동기화
    useEffect(() => {
        if (!initialContent) return;

        try {
            // 내가 방금 서버에 보낸 내용과 똑같다면 업데이트 건너뜀
            if (initialContent === lastPushedContent.current) return;

            const serverData = JSON.parse(initialContent);
            const currentData = JSON.stringify(editor.document);

            if (currentData !== initialContent) {
                isSelfUpdating.current = true;
                editor.replaceBlocks(editor.document, serverData);

                // 브라우저 렌더링 직후 바로 해제
                setTimeout(() => {
                    isSelfUpdating.current = false;
                }, 10);
            }
        } catch (error) {
            console.error("에디터 컨텐츠 파싱 실패:", error);
        }
    }, [initialContent, editor]);

    // 에디터 -> 서버 (디바운스 적용)
    // 500ms 동안 타이핑이 멈추면 그때 한 번만 서버로 전송
    const debouncedOnChange = useCallback(
        debounce((content: string) => {
            lastPushedContent.current = content; // 내가 보낸 내용을 기록
            onChange(content);
        }, 500),
        [onChange]
    );

    const handleEditorChange = () => {
        if (!isSelfUpdating.current) {
            const newContent = JSON.stringify(editor.document);
            if (newContent !== lastPushedContent.current) {
                debouncedOnChange(newContent);
            }
        }
    };

    return { handleEditorChange };
};