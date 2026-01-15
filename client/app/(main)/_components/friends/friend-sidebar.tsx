"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import FriendRequestList from "./friend-request-list";
import FriendListItem from "./friend-list-item";
import AddFriend from "./add-friend";
import { useFriend } from "./friend-context";

export const FriendSidebar = () => {
    const { friendsList, onFriendClick, selectedFriend } = useFriend();

    return (
        <div className="h-full p-5 pt-6 relative flex flex-col">
            <div className="flex items-center mb-4">
                <div className="font-semibold">친구 목록</div>
                <div className="ml-auto">
                    <FriendRequestList />
                </div>
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
                {friendsList?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        아직 허용해준 친구가 없어요
                    </div>
                ) : (
                    <div className="space-y-1">
                        {friendsList?.map((friend: any) => (
                            <FriendListItem
                                key={friend._id}
                                friend={friend}
                                onClick={() => onFriendClick(friend)}
                                isSelected={selectedFriend?._id === friend._id}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="mt-auto pt-4 border-t">
                <div className="flex items-center justify-between gap-x-2">
                    <div className="text-[10px] md:text-xs font-medium text-muted-foreground leading-tight">
                        새로운 친구를<br />추가하고 싶나요?
                    </div>
                    <AddFriend />
                </div>
            </div>
        </div>
    );
};