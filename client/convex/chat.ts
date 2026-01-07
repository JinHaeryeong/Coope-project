import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 메세지 전송
export const sendMessage = mutation({
    args: {
        roomId: v.string(),
        senderId: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.roomId || !args.senderId || !args.text.trim()) {
            throw new Error("유효하지않은 메세지입니다.")
        }

        const message = await ctx.db.insert("messages", {
            roomId: args.roomId,
            senderId: args.senderId,
            text: args.text
        }
        )
        const existingStatus = ctx.db.query("userReadStatus").filter((q) => q.eq(q.field("roomId"), args.roomId)).first();
        if (!existingStatus) {
            await ctx.db.insert("userReadStatus", {
                lastReadmessageId: message,
                roomId: args.roomId,
                userId: args.senderId
            })
        }
    }
});



//메세지 가져오기
export const getMessages = query({
    args: {
        roomId: v.string()  // 메시지를 가져올 채팅방 ID
    },
    handler: async (ctx, args) => {
        // 해당 roomId에 속한 모든 메시지를 가져옴
        const messages = await ctx.db.query("messages")
            .withIndex("byRoomId", q => q.eq("roomId", args.roomId))
            .order("desc")
            .collect();

        // 파일 URL 추가하기
        const messagesWithFileUrls = await Promise.all(
            messages.map(async (message) => {
                // 파일이 있는 경우에만 URL 생성
                if (message.file) {
                    return {
                        ...message,
                        fileUrl: await ctx.storage.getUrl(message.file)
                    };
                }
                return message;
            })
        );

        return messagesWithFileUrls.reverse(); // 오래된 메시지가 위로 오도록 정렬
    }
});

//파일이 포함됐을 때의 메세지 저장
export const sendFile = mutation({
    args: {
        storageId: v.id("_storage"),
        text: v.string(),
        author: v.string(),
        format: v.string(),
        fileName: v.string(),
        roomId: v.string()
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.insert("messages", {
            file: args.storageId,
            text: args.text,
            senderId: args.author,
            format: args.format,
            fileName: args.fileName,
            roomId: args.roomId
        })
        const existingStatus = ctx.db.query("userReadStatus").filter((q) => q.eq(q.field("roomId"), args.roomId)).first();
        if (!existingStatus) {
            await ctx.db.insert("userReadStatus", {
                lastReadmessageId: message,
                roomId: args.roomId,
                userId: args.author
            })
        }
    }
})

//새 메세지(보류)
export const getNewMessages = query({
    args: {
        lastReadMessage: v.id("messages")
    },
    handler: async (ctx, args) => {

    }
});