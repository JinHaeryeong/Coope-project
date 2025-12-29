import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import AddFriend from "./addFriend";
import FriendRequestList from "./friendRequestList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { FunctionReturnType } from "convex/server";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GenericId } from "convex/values";
import { Phone, Plus, X } from "lucide-react";
import CallModal from "../call/callModal";
import FriendListItem from "./friend-list-item";
import { MessageItem } from "./message-item";
import ChatInput from "./chat-input";

const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

export type FriendsListType = FunctionReturnType<typeof api.friends.get>; // api.friends.get를 통해 받아오는 return 값을 type으로 가지게 함
export type FriendType = FriendsListType[number]; // 친구 목록의 단일 타입을 얻기 위해서 필요
interface FriendPageProps {
    initialFriends: FriendsListType; // 구체적인 타입을 넣으면 더좋음
}

const FriendPage = ({ initialFriends }: FriendPageProps) => {
    const { user } = useUser();
    const createOrGetChatRoom = useMutation(api.rooms.createOrGetChatRoom);
    const friendsList = initialFriends;
    const [messageInput, setMessageInput] = useState("");
    const [selectedFriend, setSelectedFriend] = useState<FriendType & { roomId: string } | null>(null);
    const sendMessage = useMutation(api.chat.sendMessage);
    //useQuery 훅을 사용할 때 "skip"을 인자로 전달하면 쿼리가 실행되지 않음. 즉, 조건부로 쿼리를 실행하고 싶을 때 사용할 수 있는 특별한 값~
    const messages = useQuery(api.chat.getMessages, selectedFriend ? { roomId: selectedFriend.roomId } : "skip");
    type MessageType = FunctionReturnType<typeof api.chat.getMessages>;
    const fileInput = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null); //채팅을 맨 아래를 항상 비추도록 하기 위한 것22
    const [isModalOpen, setIsModalOpen] = useState(false);//전화 모달
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "auto" });
        }
    })
    if (!user) {
        return <div className="h-full flex justify-center items-center">유저 정보 로딩중...</div>;
    }


    const handleFriendClick = async (friend: { friendName: string | undefined; friendEmail: string | undefined; friendIcon: string | undefined; _id: GenericId<"friends">; _creationTime: number; userId: string; friendId: string; status: string; }) => {
        try {
            const chatRoom = await createOrGetChatRoom({ user1Id: user.id, user2Id: friend.friendId });

            if ('roomId' in chatRoom) {
                setSelectedFriend({
                    ...friend,
                    roomId: chatRoom.roomId
                })
            } else {
                console.log('채팅방의 번호가 없습니다.')
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedFriend?.roomId) return;


        if (selectedFile) {
            const sendFileUrl = new URL(`${convexSiteUrl}/sendFile`);
            sendFileUrl.searchParams.set("author", user.id);
            sendFileUrl.searchParams.set("text", messageInput);
            sendFileUrl.searchParams.set("roomId", selectedFriend.roomId);
            sendFileUrl.searchParams.set("format", selectedFile.type);
            sendFileUrl.searchParams.set("fileName", selectedFile.name);

            try {
                const response = await fetch(sendFileUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });

                if (!response.ok) {
                    console.log('오류난건가')
                }
            } catch (error) {
                console.log("파일 업로드에 에러가 발생했습니다:", error);
                throw error;
            }

        } else {
            await sendMessage({
                roomId: selectedFriend.roomId, // 채팅방 Id
                senderId: user.id, // 보낸사람 ID
                text: messageInput,
            })
        }

        setMessageInput("");
        setSelectedFile(null);
    };

    const redirectToCall = () => {
        setIsModalOpen(true); // 모달 열림
    };

    const closeModal = () => {
        setIsModalOpen(false); // 모달 닫힘
    };


    return (
        <div className="h-full">
            <ResizablePanelGroup
                direction="horizontal"
                className="min-h-[200px] rounded-lg border md:min-w-[450px]"
            >
                <ResizablePanel defaultSize={25}>
                    <div className="h-full p-5 relative">
                        <div className="flex items-center">
                            <div className="font-semibold">친구 목록</div>
                            <div className="ml-auto">
                                <FriendRequestList />
                            </div>
                        </div>
                        <div>
                            {friendsList?.length === 0 ? (
                                <div className="justify-center items-center h-full" >
                                    <div>아직 허용해준 친구가 없어요</div>
                                </div>
                            ) : (

                                <ScrollArea className="h-full w-full rounded-md">
                                    <div className="p-4">
                                        {friendsList?.map((friend) => (
                                            <FriendListItem
                                                key={friend._id}
                                                friend={friend}
                                                onClick={() => handleFriendClick(friend)}
                                                isSelected={selectedFriend?._id === friend._id} // 현재 선택된 친구인지 체크
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                        <div className="absolute bottom-5 right-2">
                            <div className="flex items-end">
                                <div className="mr-2 font-medium">새로운 친구를 추가하고 싶나요?</div>
                                <AddFriend />
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={75}>
                    <div className="h-full flex flex-col bg-white dark:bg-[#1F1F1F]"> {/* 전체를 수직 Flex로 설정 */}
                        {selectedFriend ? (
                            <>
                                {/* 헤더 영역 (고정 높이) */}
                                <div className="flex justify-between items-center shadow-sm p-4 border-b shrink-0"> {/* shrink-0으로 크기 고정 */}
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedFriend.friendName}</h2>
                                        <p className="text-xs text-gray-500">{selectedFriend.friendEmail}</p>
                                    </div>
                                    <div className="flex items-center gap-x-2">
                                        <Button variant="outline" size="icon" onClick={redirectToCall} className="rounded-full">
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                        <CallModal isOpen={isModalOpen} onClose={closeModal} roomId={selectedFriend.roomId} />
                                    </div>
                                </div>

                                {/* 메시지 리스트 영역 (가변 높이) */}
                                <div className="flex-1 min-h-0 relative"> {/* flex-1로 남는 공간 다 차지 */}
                                    <ScrollArea className="h-full w-full">
                                        <div className="p-4">
                                            {messages?.map((message, index) => (
                                                <MessageItem
                                                    key={message._id}
                                                    message={message}
                                                    isMine={message.senderId === user.id}
                                                    isSameSender={index > 0 && messages[index - 1].senderId === message.senderId}
                                                    friendInfo={{ name: selectedFriend.friendName, icon: selectedFriend.friendIcon }}
                                                    convexSiteUrl={convexSiteUrl}
                                                />
                                            ))}
                                            <div ref={bottomRef} />
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* 하단 입력창 영역 (고정 높이) */}
                                <div className="shrink-0 border-t"> {/* 입력창 영역 */}
                                    <ChatInput
                                        messageInput={messageInput}
                                        setMessageInput={setMessageInput}
                                        selectedFile={selectedFile}
                                        setSelectedFile={setSelectedFile}
                                        onSend={handleSendMessage}
                                        fileInputRef={fileInput}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col h-full items-center justify-center">
                                <Image
                                    src="/chat.png"
                                    height={500}
                                    width={500}
                                    alt="채팅"
                                />
                                <div className="text-muted-foreground">친구를 선택하여 대화를 시작해보세요</div>
                            </div>
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default FriendPage;