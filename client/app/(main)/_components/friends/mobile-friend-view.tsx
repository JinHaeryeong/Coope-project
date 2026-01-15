"use client";

import { useFriend } from "./friend-context";
import { MobileFriendList } from "./mobile-friend-list";
import { MobileChatWindow } from "./chat/mobile-chat-window";

const MobileFriendView = () => {
    const { selectedFriend } = useFriend();

    // 선택된 친구가 있으면 채팅창, 없으면 목록
    return selectedFriend ? <MobileChatWindow /> : <MobileFriendList />;
};

export default MobileFriendView;