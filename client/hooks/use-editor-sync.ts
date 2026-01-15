import { useEffect, useRef } from "react";
import { BlockNoteEditor } from "@blocknote/core";

// 훅이 받을 인자들의 타입을 정의
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

    useEffect(() => {
        // 서버 데이터가 있고, 현재 에디터 내용과 다를 때만 실행
        if (initialContent) {
            try {
                const serverData = JSON.parse(initialContent);
                const currentData = editor.document;

                if (JSON.stringify(currentData) !== initialContent) {
                    isSelfUpdating.current = true; // 플래그 ON

                    // 에디터 내용 교체
                    editor.replaceBlocks(editor.document, serverData);

                    // 렌더링 주기를 고려해 플래그 OFF
                    setTimeout(() => {
                        isSelfUpdating.current = false;
                    }, 100);
                }
            } catch (error) {
                console.error("에디터 컨텐츠 파싱 실패:", error);
            }
        }
    }, [initialContent, editor]);

    const handleEditorChange = () => {
        // 무한 루프 방지: 내가 수정 중일 때는 부모의 onChange를 부르지 않음
        if (!isSelfUpdating.current) {
            onChange(JSON.stringify(editor.document, null, 2));
        }
    };

    return { handleEditorChange };
};