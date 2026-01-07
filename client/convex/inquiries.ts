import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

//문의 내역 출력시
export const get = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.userId) {
            return [];
        }
        else {
            return await ctx.db.query("inquiryDetails").filter((q) => q.eq(q.field("userId"), args.userId)).collect()
        };
    }
});

//관리자에게 출력되는 문의 내역
export const getInquiries = query(async (ctx) => {
    return await ctx.db.query("inquiryDetails").collect();
});

//문의 제출할 때
export const createInquiry = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        userId: v.string(),
        userName: v.string(),
        userEmail: v.string(),
        category: v.string(),
        environment: v.string(),
        files: v.array(v.object({
            storageId: v.id("_storage"),
            fileName: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        const { title, content, userId, userName, category, environment, userEmail } = args;
        const inquiry = await ctx.db.insert("inquiryDetails", {
            title, content, userId, userName, category, environment,
            userEmail
        });

        for (const file of args.files) {
            await ctx.db.insert("inquiryFiles", {
                postId: inquiry,
                file: file.storageId,
                fileName: file.fileName
            })
        }

        return inquiry;
    }
});

//convex file storage url 받아오기
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

//문의 상세페이지
export const getInquiry = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const inquiryId = ctx.db.normalizeId("inquiryDetails", args.id);
        if (!inquiryId) {
            return null;
        }

        const inquiry = await ctx.db.get(inquiryId);

        if (!inquiry) {
            return null;
        }

        const files = await ctx.db.query("inquiryFiles").filter((q) => q.eq(q.field("postId"), args.id)).collect();

        const fileWithUrls = await Promise.all(files.map(async (file) => ({
            ...file,
            url: await ctx.storage.getUrl(file.file)
        })))
        return { ...inquiry, files: fileWithUrls };
    },
});

//문의 삭제

export const deleteInquiry = mutation({
    args: { inquiryId: v.id("inquiryDetails") },
    handler: async (ctx, args) => {
        const inquiryId = args.inquiryId;
        const files = await ctx.db.query("inquiryFiles").filter((q) => q.eq(q.field("postId"), inquiryId?.toString())).collect();

        //파일 삭제
        await Promise.all(
            files.map(async (file) => {
                await ctx.storage.delete(file.file);
            }));

        //inquiryFiles 삭제
        await Promise.all(
            files.map(async (file) => {
                await ctx.db.delete(file._id);
            })
        );

        await ctx.db.delete(inquiryId);

    }
})

//문의 답변
export const answerInquiry = mutation({
    args: {
        content: v.string(),
        inquiryId: v.string(),
        authorId: v.string(),
        files: v.array(v.object({
            storageId: v.id("_storage"),
            fileName: v.string(),
        }))
    },
    handler: async (ctx, args) => {
        const answer = await ctx.db.insert("inquiryAnswer", { answer: args.content, postId: args.inquiryId, authorId: args.authorId });
        const id = await ctx.db.normalizeId("inquiryDetails", args.inquiryId);
        if (!id) {
            return;
        }
        await ctx.db.patch(id, { responseStatus: true });

        for (const file of args.files) {
            await ctx.db.insert("inquiryAnswerFiles", {
                postId: id,
                answerId: answer,
                file: file.storageId,
                fileName: file.fileName
            })
        }

        return answer;

    }
});

//문의 답변 리스트
export const listAnswer = query({
    args: {
        id: v.string()
    },
    handler: async (ctx, args) => {
        const answers = await ctx.db.query("inquiryAnswer").filter((q) => q.eq(q.field("postId"), args.id)).order("desc").collect();

        return answers;
    }
});

//문의 답변 파일들
export const ListAnswerFiles = query(
    {
        args: {
            inquiryId: v.string()
        },
        handler: async (ctx, args) => {
            const id = await ctx.db.normalizeId("inquiryDetails", args.inquiryId);
            const files = await ctx.db.query("inquiryAnswerFiles").filter((q) => q.eq(q.field("postId"), id)).collect();
            const fileWithUrls = await Promise.all(files.map(async (file) => ({
                ...file,
                url: await ctx.storage.getUrl(file.file)
            })))

            return fileWithUrls;
        }

    }
)

//문의 답변 삭제

export const deleteAnswer = mutation({
    args: { answerId: v.id("inquiryAnswer")},
    handler: async (ctx, args) => {
        const answerId = args.answerId;
        const files = await ctx.db.query("inquiryAnswerFiles").filter((q) => q.eq(q.field("answerId"), answerId?.toString())).collect();

        await Promise.all(
            files.map(async (file) => {
                await ctx.storage.delete(file.file);
            }));

        //inquiryAnswerFiles 삭제
        await Promise.all(
            files.map(async (file) => {
                await ctx.db.delete(file._id);
            })
        );

        await ctx.db.delete(answerId);
    }
})