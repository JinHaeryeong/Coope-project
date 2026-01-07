import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 16);

//기존 채팅방의 유무에 따른 새 채팅방 생성 및 기존 채팅방 불러오기
export const createOrGetChatRoom = mutation({
    args: {user1Id: v.string(),
        user2Id: v.string()
    },
    handler: async (ctx, args) => {
        const existingRoom = await ctx.db
        .query("rooms")
        .filter((q) =>
            q.or(
                q.and(q.eq(q.field("user1Id"), args.user1Id), q.eq(q.field("user2Id"), args.user2Id)),
                q.and(q.eq(q.field("user1Id"), args.user2Id), q.eq(q.field("user2Id"), args.user1Id))
            )
        )
        .first();

        if(existingRoom) {
            return existingRoom;
        }

        const roomId = nanoid();
        const newRoom = await ctx.db.insert("rooms", {
            roomId: roomId,
            user1Id: args.user1Id,
            user2Id: args.user2Id
        });

        return newRoom;
    }
})