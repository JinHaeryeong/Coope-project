"use client";

import { useMediaQuery } from "usehooks-ts";
import DesktopFriendView from "./desktop-friend-view";
import MobileFriendView from "./mobile-friend-view";
// import { FriendsListType } from "./friend-context"; // 타입 필요시

// 이제 Props인 initialFriends를 받을 필요가 없어요! (Context에서 이미 관리 중)
const FriendPage = () => {
    const isMobile = useMediaQuery("(max-width: 768px)");

    // 데이터는 자식들이 각자 useFriend()로 꺼내 쓸 거니까 분기만 해줍니다.
    return isMobile ? <MobileFriendView /> : <DesktopFriendView />;
};

export default FriendPage;