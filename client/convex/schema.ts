import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notices: defineTable({
    title: v.string(),
    content: v.string(),
    file: v.optional(v.id("_storage")),
    fileFormat: v.optional(v.string()),
    fileName: v.optional(v.string()),
    author: v.string(),
    authorId: v.string()
  }),
  comments: defineTable({
    content: v.string(),
    author: v.string(),
    authorId: v.string(),
    postId: v.string(),
    authorImgUrl: v.string(),
  }),
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
    workspaceId: v.string(),
  })
  .index("by_user", ["userId"])
  .index("by_user_parent", ["userId","parentDocument"])
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_parent", ["workspaceId", "parentDocument"]),
  inquiryDetails: defineTable({
    userId: v.string(),
    userName: v.string(), 
    title: v.string(),
    content: v.string(),
    category: v.string(),
    environment: v.string(),
    responseStatus: v.optional(v.boolean()),
    userEmail: v.string(),
  }),
  inquiryFiles: defineTable({
    postId: v.id("inquiryDetails"),
    file: v.id("_storage"),
    fileName: v.string()
  }),
  inquiryAnswer: defineTable ({
    answer: v.string(),
    postId: v.string(),
    authorId: v.string()
  }),
  inquiryAnswerFiles: defineTable({
    postId: v.id("inquiryDetails"),
    answerId: v.id("inquiryAnswer"),
    file: v.id("_storage"),
    fileName: v.string()
  }),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    userIcon: v.string()
  }).index("byExternalId", ["externalId"])
    .index("by_email", ["email"]),
  friends: defineTable({
    userId: v.string(),
    friendId: v.string(),
    status: v.string()
}).index("byUserId", ["userId"])
  .index("byFriendId", ["friendId"])
  .index("byUserIdFriendId", ["userId", "friendId"]), // 복합 인덱스 추가
  rooms: defineTable({
    roomId: v.string(),
    user1Id: v.string(),
    user2Id: v.string()
  }),
  messages: defineTable({
    roomId: v.string(),
    senderId: v.string(),
    text: v.string(),
    file: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    format: v.optional(v.string()),
  }).index("byRoomId", ["roomId"]),
  userReadStatus: defineTable({
    lastReadmessageId: v.id("messages"),
    roomId: v.string(),
    userId: v.string(),
  }),
  aiMessage: defineTable({
    userId: v.string(),
     role: v.union(v.literal("user"), v.literal("ai")),
     text: v.string(),
     createdAt: v.number(),
   }).index("by_user", ["userId"]),
   aichatMessages: defineTable({
    userId: v.string(),
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"]),
  workspaces: defineTable({
    name:  v.string(),
    createdBy:  v.string(),// userId
  }),
  workspaceMembers: defineTable({
    userId:  v.string(),
    workspaceId:  v.string(),
    role:  v.string(), // 'owner' | 'editor' | 'viewer'
  }).index('by_user', ['userId'])
    .index('by_workspace', ['workspaceId'])
    .index('by_user_workspace', ['userId', 'workspaceId']),
});