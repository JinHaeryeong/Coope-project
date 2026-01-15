// _components/friends/chat-input.tsx
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
    messageInput: string;
    setMessageInput: (val: string) => void;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    onSend: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const ChatInput = ({
    messageInput,
    setMessageInput,
    selectedFile,
    setSelectedFile,
    onSend,
    fileInputRef
}: ChatInputProps) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.nativeEvent.isComposing) return;

        if (e.key === "Enter") {
            if (e.shiftKey) {
                // Shift + Enter는 기본 동작인 줄바꿈을 허용
                return;
            } else {
                // 일반 Enter는 기본 줄바꿈을 막고 메시지를 전송
                e.preventDefault();
                onSend();
            }
        }
    };
    return (
        // p-2를 추가해 여백을 주고, border-t로 경계선을 만들면 더 깔끔하게 하기
        <div className="w-full bottom-0 bg-white dark:bg-[#1F1F1F] p-1 md:p-4 border-t">
            {selectedFile && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-md w-fit">
                    {selectedFile.type.startsWith("image/") && (
                        <div className="relative h-10 w-10">
                            <img
                                src={URL.createObjectURL(selectedFile)}
                                alt="preview"
                                className="object-cover rounded-sm h-full w-full"
                            />
                        </div>
                    )}
                    <span className="text-xs font-medium">{selectedFile.name}</span>
                    <X className="h-4 w-4 cursor-pointer text-red-500" onClick={() => setSelectedFile(null)} />
                </div>
            )}

            {/* items-center로 변경하여 모든 요소가 세로 중앙에 오도록 합니다. */}
            <div className="flex gap-2 items-center h-full">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.hwp,.pdf,.docx,.ppt,.pptx"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                    }}
                />

                {/* 플러스 버튼 */}
                <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className="shrink-0">
                    <Plus />
                </Button>

                {/* 텍스트 입력창 */}
                <Textarea
                    placeholder="메시지를 입력해주세요"
                    className="resize-none font-medium min-h-[40px] flex-1" // flex-1로 꽉 채우기
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1} // 기본 높이 설정
                />

                {/* 전송 버튼: 부모 높이에 맞춰 길어지게 설정 */}
                <Button
                    onClick={onSend}
                    className="h-[40px] px-6 shrink-0" // Textarea 기본 높이와 맞춤
                >
                    전송
                </Button>
            </div>
        </div>
    );
};

export default ChatInput;