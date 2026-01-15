"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone } from "lucide-react";
import { useFriend } from "../friend-context";
import { MessageItem } from "./message-item";
import ChatInput from "./chat-input";
import CallModal from "../../call/call-modal";

export const ChatWindow = () => {
    const {
        user,
        selectedFriend,
        messages,
        messageInput,
        setMessageInput,
        selectedFile,
        setSelectedFile,
        handleSendMessage,
        fileInputRef,
        bottomRef,
        isModalOpen,
        setIsModalOpen
    } = useFriend();

    if (!user || !selectedFriend) {
        return null;
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1F1F1F]">
            {/* 헤더 */}
            <div className="flex justify-between items-center shadow-sm p-4 border-b shrink-0">
                <div>
                    <h2 className="text-xl font-bold">{selectedFriend.friendName}</h2>
                    <p className="text-xs text-gray-500">{selectedFriend.friendEmail}</p>
                </div>
                <div className="flex items-center gap-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-full"
                    >
                        <Phone className="h-4 w-4" />
                    </Button>
                    <CallModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        roomId={selectedFriend.roomId}
                    />
                </div>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full w-full">
                    <div className="p-4">
                        {messages?.map((message: any, index: number) => (
                            <MessageItem
                                key={message._id}
                                message={message}
                                isMine={message.senderId === user.id}
                                isSameSender={index > 0 && messages[index - 1].senderId === message.senderId}
                                friendInfo={{ name: selectedFriend.friendName, icon: selectedFriend.friendIcon }}
                            />
                        ))}
                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* 입력창 */}
            <div className="shrink-0 border-t">
                <ChatInput
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    onSend={handleSendMessage}
                    fileInputRef={fileInputRef}
                />
            </div>
        </div>
    );
};