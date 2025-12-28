import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 친구 리스트 출력
// friends.ts 수정 예시

export const get = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const friendsList = await ctx.db
            .query("friends")
            .withIndex("byUserId", (q) => q.eq("userId", args.id))
            .collect();

        const friendsWithInfo = await Promise.all(
            friendsList.map(async (friend) => {
                // filter 대신 withIndex 사용으로 성능과 정확도 확보
                const friendInfo = await ctx.db
                    .query("users")
                    .withIndex("byExternalId", (q) => q.eq("externalId", friend.friendId))
                    .unique();

                return {
                    ...friend,
                    friendName: friendInfo?.name,
                    friendEmail: friendInfo?.email,
                    friendIcon: friendInfo?.userIcon
                };
            })
        );

        return friendsWithInfo;
    }
});






// 내가 요청중인 친구 목록
export const getFriendRequest = query({
    args: {
        id: v.string()
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("friends")
            .withIndex("byUserId", (q) => q.eq("userId", args.id))
            .filter((q) => q.eq(q.field("status"), "요청중"))
            .collect();
    }
})
//나에게 온 친구 요청 목록
export const getRequest = query({
    args: {
        id: v.string()
    },
    handler: async (ctx, args) => {
        // 친구 요청 목록을 friends 테이블에서 가져오기
        const friendRequests = await ctx.db
            .query("friends")
            .withIndex("byFriendId", (q) => q.eq("friendId", args.id))
            .filter((q) => q.eq(q.field("status"), "요청중"))
            .collect();

        // 친구 요청 목록에 대해 각 userId에 대한 추가 정보를 users 테이블에서 가져오기
        const requestsWithUserInfo = await Promise.all(friendRequests.map(async (friendRequest) => {
            // userId에 해당하는 유저 정보 가져오기
            const user = await ctx.db
                .query("users")
                .withIndex("byExternalId", (q) => q.eq("externalId", friendRequest.userId))
                .unique();

            return {
                ...friendRequest,
                userName: user?.name,         // userName 추가
                userEmail: user?.email,       // userEmail 추가
                userIcon: user?.userIcon,     // userIcon 추가
            };
        }));

        return requestsWithUserInfo;
    }
});



// 친구 요청
export const sendFriendRequest = mutation({
    args: {
        userId: v.string(),
        friendId: v.string()
    },
    handler: async (ctx, args) => {
        // 이미 친구 요청이 존재하는지 확인
        const existingRequest = await ctx.db.query("friends")
            .withIndex("byUserIdFriendId", (q) =>
                q.eq("userId", args.userId).eq("friendId", args.friendId)
            )
            .unique();


        if (existingRequest?.status === "요청중") {
            return { success: false, message: "이미 친구 요청이 있습니다." };
        }
        if (existingRequest?.status === "수락됨") {
            return { success: false, message: "이미 친구입니다." };
        }




        await ctx.db.insert("friends", {
            userId: args.userId,
            friendId: args.friendId,
            status: "요청중"
        });

        return { success: true };
    }
});


// 친구 요청 수락
export const acceptFriendRequest = mutation({
    args: {
        userId: v.string(),
        friendId: v.string()
    },
    handler: async (ctx, args) => {
        const friendRequest = await ctx.db.query("friends")
            .withIndex("byUserIdFriendId", (q) =>
                q.eq("userId", args.userId).eq("friendId", args.friendId) // 요청을 받은 사람 기준
            )
            .unique();

        if (!friendRequest) {
            throw new Error("Friend request not found");
        }

        // 친구 요청 상태 변경 (요청 -> 수락)
        await ctx.db.patch(friendRequest._id, { status: "수락됨" });

        // 반대 방향의 관계도 생성 (friendId → userId)
        await ctx.db.insert("friends", {
            userId: args.friendId,
            friendId: args.userId,
            status: "수락됨"
        });
    }
});
