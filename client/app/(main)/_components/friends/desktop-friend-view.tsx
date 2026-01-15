"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Image from "next/image";
import { useFriend } from "./friend-context";
import { FriendSidebar } from "./friend-sidebar";
import { ChatWindow } from "./chat/chat-window";

const DesktopFriendView = () => {
    const { selectedFriend } = useFriend();

    return (
        <div className="h-full">
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full rounded-lg border"
            >
                <ResizablePanel defaultSize={25} minSize={20}>
                    <FriendSidebar />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    {selectedFriend ? (
                        <ChatWindow />
                    ) : (
                        <div className="flex flex-col h-full items-center justify-center bg-slate-50 dark:bg-[#1F1F1F]">
                            <Image src="/chat.png" height={300} width={300} alt="채팅" className="opacity-50" />
                            <div className="text-muted-foreground mt-4 font-medium">
                                친구를 선택하여 대화를 시작해보세요
                            </div>
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default DesktopFriendView;