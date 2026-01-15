"use client";

import { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react";
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

const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

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

    useEffect(() => {
        if (messages && messages.length > 0) {
            // 렌더링이 완료된 직후에 실행되도록 setTimeout을 살짝 줍니다.
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [messages]);

    // 메시지 전송 로직
    const handleSendMessage = async () => {
        // 텍스트도 없고 파일도 없으면 입구컷
        if ((!messageInput.trim() && !selectedFile) || !selectedFriend?.roomId || !user) return;

        try {
            if (selectedFile) {
                // 파일이 있는 경우: HTTP Action 주소로 전송
                const sendFileUrl = new URL(`${convexSiteUrl}/sendFile`);
                sendFileUrl.searchParams.set("author", user.id);
                sendFileUrl.searchParams.set("text", messageInput);
                sendFileUrl.searchParams.set("roomId", selectedFriend.roomId);
                sendFileUrl.searchParams.set("format", selectedFile.type);
                sendFileUrl.searchParams.set("fileName", selectedFile.name);

                const response = await fetch(sendFileUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });

                if (!response.ok) throw new Error("파일 업로드 실패");

            } else {
                // 텍스트만 있는 경우: 기존 Mutation 사용
                await sendMessage({
                    roomId: selectedFriend.roomId,
                    senderId: user.id,
                    text: messageInput,
                });
            }

            // 공통 마무리: 상태 초기화
            setMessageInput("");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);

        } catch (error) {
            console.error("메시지 전송 에러:", error);
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