"use client";

import { useFriend } from "../friend-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Phone } from "lucide-react";
import { MessageItem } from "./message-item";
import ChatInput from "./chat-input";
import CallModal from "../../call/call-modal";

export const MobileChatWindow = () => {
    const {
        user,
        selectedFriend,
        setSelectedFriend,
        messages,
        messageInput,
        setMessageInput,
        handleSendMessage,
        bottomRef,
        fileInputRef,
        isModalOpen,
        setIsModalOpen,
        selectedFile,
        setSelectedFile,
    } = useFriend();

    if (!user || !selectedFriend) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-[#1F1F1F] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center p-4 border-b shrink-0 gap-x-3 bg-white dark:bg-[#1F1F1F]">
                <Button variant="ghost" size="icon" onClick={() => setSelectedFriend(null)}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold truncate text-sm">{selectedFriend.friendName}</h2>
                    <p className="text-[10px] text-muted-foreground truncate">{selectedFriend.friendEmail}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(true)}>
                    <Phone className="h-4 w-4" />
                </Button>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full w-full">
                    <div className="p-4 pb-10">
                        {messages?.map((message: any, index: number) => (
                            <MessageItem
                                key={message._id}
                                message={message}
                                isMine={message.senderId === user.id}
                                isSameSender={index > 0 && messages[index - 1].senderId === message.senderId}
                                friendInfo={{
                                    name: selectedFriend.friendName,
                                    icon: selectedFriend.friendIcon,
                                }}
                            />
                        ))}
                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* 입력창 */}
            <div className="shrink-0">
                <ChatInput
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    onSend={handleSendMessage}
                    fileInputRef={fileInputRef}
                />
            </div>

            <CallModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roomId={selectedFriend.roomId}
            />
        </div>
    );
};