import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


//댓글 작성
export const addComment = mutation({
  args:{ 
    content: v.string(),
    author: v.string(),
    authorId: v.string(),
    postId: v.string(),
    authorImgUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.insert("comments",{ content: args.content, author: args.author, postId: args.postId, authorImgUrl: args.authorImgUrl, authorId: args.authorId});
    return comment;
  },
});

//댓글 리스트 불러오기
export const listComments = query({
  args:{
    id: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("comments").filter((q)=> q.eq(q.field("postId"), args.id)).order("desc").collect();
  }
});

//댓글 삭제
export const deleteComment = mutation({
  args: {commentId: v.id("comments") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.commentId);
  }
});

//댓글 수정
export const editComment = mutation({
  args: {id: v.id("comments"), content: v.string()},
  handler: async (ctx, args) => {
    const { id } = args;
    await ctx.db.patch(id, {content: args.content})
  }
});