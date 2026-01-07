// convex/workspace.ts
import { mutation } from "./_generated/server";
import { query } from './_generated/server';
import { Id } from "./_generated/dataModel"
import { v } from 'convex/values';

export const createWorkspace = mutation({
  args: {
    name: v.string(), // ✅ userId는 받지 않음!
  },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const userId = identity.subject;

    const workspaceId = await ctx.db.insert('workspaces', {
      name,
      createdBy: userId,
    });

    await ctx.db.insert('workspaceMembers', {
      userId,
      workspaceId,
      role: 'owner',
    });

    // users 테이블의 name도 workspace name으로 동기화
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', userId))
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { name });
    }

    return workspaceId;
  },
});

export const joinWorkspace = mutation({
  args: {
    workspaceId: v.string(),
  },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;

    const alreadyMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", q =>
        q.eq("userId", userId).eq("workspaceId", workspaceId)
      )
      .first();

    if (alreadyMember) {
      return "already_member" as const;
    }

    await ctx.db.insert("workspaceMembers", {
      userId,
      workspaceId,
      role: "editor",
    });

    return "joined" as const;
  },
});

export const getMyWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return []; // ✅ 로그인 안 되어 있으면 빈 배열 반환

    const userId = identity.subject;

    const memberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspaceId as Id<'workspaces'>);
        if (!workspace || !('name' in workspace)) return null;

        return {
          _id: workspace._id,
          name: workspace.name,
          role: membership.role,
        };
      })
    );

    return workspaces.filter(Boolean); // null 제거
  },
});

export const inviteToWorkspace = mutation({
  args: {
    workspaceId: v.string(),
    email: v.string(), // 초대할 유저 이메일
  },
  handler: async (ctx, { workspaceId, email }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return "unauthorized" as const;

    const inviterId = identity.subject;

    // 1. 초대한 사람이 owner인지 확인
    const inviterMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", inviterId).eq("workspaceId", workspaceId)
      )
      .first();

    if (!inviterMembership || inviterMembership.role !== "owner") {
      return "unauthorized" as const;
    }

    // 2. 초대받을 유저 찾기
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!existingUser) {
      return "not_found" as const;
    }

    // 3. 이미 멤버인지 확인
    const existingMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", existingUser._id).eq("workspaceId", workspaceId)
      )
      .first();

    if (existingMembership) {
      return "already_member" as const;
    }

    // 4. 멤버로 추가
    await ctx.db.insert("workspaceMembers", {
      userId: existingUser._id,
      workspaceId,
      role: "editor", // 기본 권한
    });

    return "invited" as const;
  },
});

export const getDocuments = query({
  args: {
    workspaceId: v.string(),
  },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db
      .query("documents")
      .withIndex("by_workspace", q => q.eq("workspaceId", workspaceId))
      .filter(q => q.eq(q.field("isArchived"), false)) 
      .collect();
  },
});

export const rename = mutation({
  args: {
    id: v.id("workspaces"),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const workspace = await ctx.db.get(id);
    if (!workspace) throw new Error("Workspace not found");

    // 소유자 확인
    const userId = identity.subject;
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", q =>
        q.eq("userId", userId).eq("workspaceId", id)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only the owner can rename the workspace");
    }

    await ctx.db.patch(id, { name });
  },
});

export const remove = mutation({
  args: {
    id: v.id("workspaces"),
  },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const workspace = await ctx.db.get(id);
    if (!workspace) throw new Error("Workspace not found");

    // 소유자 확인
    const userId = identity.subject;
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", q =>
        q.eq("userId", userId).eq("workspaceId", id)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only the owner can delete the workspace");
    }

    // 워크스페이스 삭제 (멤버십도 정리하면 더 좋음)
    await ctx.db.delete(id);

    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", q => q.eq("workspaceId", id))
      .collect();

    await Promise.all(
      memberships.map((m) => ctx.db.delete(m._id))
    );
  },
});

export const getById = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const workspace = await ctx.db.get(id);
    if (!workspace) return null;

    return {
      _id: workspace._id,
      name: workspace.name,
      createdBy: workspace.createdBy,
    };
  },
});