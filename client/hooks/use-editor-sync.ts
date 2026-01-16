import { useEffect, useRef, useMemo } from "react";
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
    const lastPushedContent = useRef(initialContent);



    // (수정) debounce 함수를 useMemo로 감싸고, cleanup 로직 추가
    const debouncedOnChange = useMemo(
        () => debounce((content: string) => {
            lastPushedContent.current = content;
            onChange(content);
        }, 500),
        [onChange]
    );

    // (추가) 컴포넌트가 사라질 때 남아있는 디바운스 취소 (메모리 누수 방지)
    useEffect(() => {
        return () => {
            debouncedOnChange.cancel();
        };
    }, [debouncedOnChange]);

    useEffect(() => {
        if (!initialContent) return;
        try {
            if (initialContent === lastPushedContent.current) return;

            const serverData = JSON.parse(initialContent);
            const currentData = JSON.stringify(editor.document);

            if (currentData !== initialContent) {
                isSelfUpdating.current = true;
                editor.replaceBlocks(editor.document, serverData);

                // (수정) setTimeout 대신 브라우저 렌더링 프레임에 맞춤
                requestAnimationFrame(() => {
                    isSelfUpdating.current = false;
                });
            }
        } catch (error) {
            console.error("에디터 컨텐츠 파싱 실패:", error);
        }
    }, [initialContent, editor]);

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