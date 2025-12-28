"use client"

import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import Image from "next/image";
import { useState } from "react";
import AddFriend from "../../../../_components/friends/addFriend"; // 친구 추가 버튼과 기능
import FriendPage from "../../../../_components/friends/friend"; // 친구(요청중, 수락됨)이 있을 경우의 페이지
import FriendRequestList from "../../../../_components/friends/friendRequestList";

const ListOfFriends = () => {
  const { user } = useUser();
  // 전체 리스트(수락 + 요청중)를 한 번만 가져옵니다.
  const allFriendList = useQuery(api.friends.get, user?.id ? { id: user.id } : "skip");

  if (!user) return null;

  // 로딩 중일 때 스켈레톤
  if (allFriendList === undefined) {
    return (
      <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10 space-y-4 pl-8 pt-4">
        <Skeleton className="h-14 w-[50%]" />
        <Skeleton className="h-14 w-[80%]" />
      </div>
    );
  }

  // 실제 대화 가능한 '수락됨' 친구만 필터링
  const acceptedFriends = allFriendList.filter(f => f.status === "수락됨");

  // 수락된 친구가 한 명도 없다면 로봇 화면을 보여줍니다.
  // (요청 중인 친구만 있어도 대화는 못 하니까요!)
  if (acceptedFriends.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Image src="/robot.png" height={300} width={300} alt="empty" priority />
        <h2 className="text-lg font-medium">대화할 친구가 없어요. 새로운 친구를 추가해볼까요?</h2>

        <div className="flex gap-2">
          <Image src="/robot.png" height={300} width={300} alt="empty" priority />
          <AddFriend />
          <FriendRequestList />
        </div>
      </div>
    );
  }

  // 4. 수락된 친구가 있다면 데이터를 넘겨주며 FriendPage를 엽니다.
  return (
    <div className="h-full">
      <FriendPage initialFriends={acceptedFriends} />
    </div>
  );
};

export default ListOfFriends;