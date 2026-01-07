import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";


//글쓰기로 notice 작성 후 게시 눌렀을 때
export const createNotice = mutation({
  args:{ title: v.string(),
  content: v.string(),
  storageId: v.optional(v.id("_storage")),
  author: v.string(),
  fileFormat: v.optional(v.string()),
  fileName: v.optional(v.string()),
  authorId: v.string(),},
  
  handler: async (ctx, args) => {
    const { title, content, author, storageId, fileFormat, fileName, authorId } = args;
    const notice = await ctx.db.insert("notices",{ title, content, author, file: storageId, fileFormat, fileName, authorId});
    return notice;
  },
});

//notices 테이블 불러옴
export const get = query(async (ctx) => {
    return await ctx.db.query("notices").collect();
});

export const getNoticeForComments = query({
  args: {id: v.id("notices")},
  handler: async (ctx, args) => {
    const id = ctx.db.get(args.id);
    if (!id) {
      return null;
    }
    return id;
  }
})

//게시글을 불러오기 위한 쿼리문
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("notices", args.id);
    if (id === null) {
      return null;
    }
    const notice = await ctx.db.get(id);
    if (!notice) {
      return null;
    }
    
    let fileUrl = null;
    if (notice.file) {
      fileUrl = await ctx.storage.getUrl(notice.file);
    }
    
    return { ...notice, fileUrl };
  },
});

//file storage 가져오기
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
})

//notice 수정
export const updateNotice = mutation({
  args: {
    noticeId: v.id("notices"),
    title: v.string(),
    content: v.string(),
    fileFormat: v.optional(v.string()),
    fileName: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
   },
   handler: async (ctx, args) => {
    if (!args.noticeId) {
      return null;
    }
    const notice = await ctx.db.get(args.noticeId);

    if (!notice) {
      throw new Error("공지사항을 찾을 수 없습니다.");
    }
 
    if (notice.file && notice.file !==args.storageId) {
      await ctx.storage.delete(notice.file);
    }
    
    await ctx.db.patch(args.noticeId, {title: args.title, content: args.content, file: args.storageId, fileName: args.fileName, fileFormat: args.fileFormat});
   }
});

//notice 삭제 && 달려있는 댓글 삭제
export const deleteNotice = mutation({
  args: { noticeId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("notices", args.noticeId);
    if (!id) {
      return null;
    }

    // 게시글 정보 가져오기
    const notice = await ctx.db.get(id);
    if (!notice) {
      return null;
    }

    // 파일이 있다면 삭제
    if (notice.file) {
      await ctx.storage.delete(notice.file as Id<"_storage">);
    }

    // 게시글 삭제
    await ctx.db.delete(id);

    // 댓글 삭제
    const comments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("postId"), args.noticeId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }
  },
});

