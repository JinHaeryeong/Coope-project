"use client";

import { useFriend } from "./friend-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import FriendListItem from "./friend-list-item";
import FriendRequestList from "./friend-request-list";
import AddFriend from "./add-friend";

export const MobileFriendList = () => {
    const { friendsList, onFriendClick } = useFriend();

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1F1F1F]">
            <div className="p-4 mt-2 box-border border-b flex items-center justify-between shrink-0">
                <h1 className="text-xl font-bold">친구</h1>
                <FriendRequestList />
            </div>

            <ScrollArea className="flex-1 px-4">
                <div className="py-4 space-y-2">
                    {friendsList?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-20 text-muted-foreground text-sm">
                            <p>등록된 친구가 없습니다.</p>
                        </div>
                    ) : (
                        friendsList?.map((friend: any) => (
                            <FriendListItem
                                key={friend._id}
                                friend={friend}
                                onClick={() => onFriendClick(friend)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t flex justify-end">
                <AddFriend />
            </div>
        </div>
    );
};