import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const addMessage = mutation({
  args: {
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.insert("aichatMessages", {
      userId: user._id,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    });
  },
});

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    
    const messages = await ctx.db
      .query("aichatMessages")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    return messages.reverse();
  },
});

export const clearMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }
    
    const messages = await ctx.db
      .query("aichatMessages")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    await Promise.all(messages.map((message) => ctx.db.delete(message._id)));
  },
}); 