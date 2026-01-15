"use client";

import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FunctionReturnType } from "convex/server";
import type { UserResource } from "@clerk/types";

// Convex에서 내려오는 데이터 타입 정의
export type FriendsListType = FunctionReturnType<typeof api.friends.get>;
export type FriendType = FriendsListType[number];
export type MessageType = FunctionReturnType<typeof api.chat.getMessages>[number];

// Context가 관리할 데이터 인터페이스 정의
interface FriendContextType {
    user: UserResource | null | undefined;
    friendsList: FriendsListType;
    selectedFriend: (FriendType & { roomId: Id<"rooms"> }) | null;
    setSelectedFriend: (friend: (FriendType & { roomId: Id<"rooms"> }) | null) => void;
    messages: MessageType[] | undefined;
    messageInput: string;
    setMessageInput: (value: string) => void;
    onFriendClick: (friend: FriendType) => Promise<void>;
    handleSendMessage: () => Promise<void>;
    bottomRef: React.RefObject<HTMLDivElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
}

const FriendContext = createContext<FriendContextType | null>(null);

export const FriendProvider = ({
    children,
    initialFriends
}: {
    children: ReactNode;
    initialFriends: FriendsListType;
}) => {
    const { user } = useUser();
    const [selectedFriend, setSelectedFriend] = useState<(FriendType & { roomId: Id<"rooms"> }) | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createOrGetChatRoom = useMutation(api.rooms.createOrGetChatRoom);
    const sendMessage = useMutation(api.chat.sendMessage);

    // 메시지 조회 (자동 동기화)
    const messages = useQuery(
        api.chat.getMessages,
        selectedFriend?.roomId ? { roomId: selectedFriend.roomId } : "skip"
    );

    // 메시지 전송 로직
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedFriend?.roomId || !user) return;

        try {
            // 파일 전송 로직이 있다면 여기에 추가 (현재는 텍스트만 처리)
            await sendMessage({
                roomId: selectedFriend.roomId,
                senderId: user.id,
                text: messageInput,
            });

            setMessageInput("");
            setSelectedFile(null);

            // 전송 후 스크롤 하단 이동
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    // 친구 목록에서 클릭 시 채팅방 열기
    const onFriendClick = async (friend: FriendType) => {
        if (!user) return;
        try {
            const chatRoom = await createOrGetChatRoom({
                user1Id: user.id,
                user2Id: friend.friendId
            });

            if (chatRoom && "_id" in chatRoom) {
                setSelectedFriend({
                    ...friend,
                    roomId: chatRoom._id as Id<"rooms">
                });
            }
        } catch (error) {
            console.error("Failed to open chat room:", error);
        }
    };

    const value: FriendContextType = {
        user,
        friendsList: initialFriends,
        selectedFriend,
        setSelectedFriend,
        messages,
        messageInput,
        setMessageInput,
        onFriendClick,
        handleSendMessage,
        bottomRef,
        fileInputRef,
        isModalOpen,
        setIsModalOpen,
        selectedFile,
        setSelectedFile
    };

    return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
};


export const useFriend = () => {
    const context = useContext(FriendContext);
    if (!context) {
        throw new Error("useFriend must be used within a FriendProvider");
    }
    return context;
};