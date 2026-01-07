import {v} from 'convex/values'

import {mutation,query} from './_generated/server'
import {Doc,Id} from './_generated/dataModel'


export const archive = mutation({
  args:{id:v.id("documents")},
  handler:async (context,args) => {
   const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Not authenticated")
    }

    const userId = identity.subject
    
    const existingDocument = await context.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const recursiveArchive = async (documentId:Id<'documents'>) => {
      const children = await context.db
      .query('documents')
      .withIndex("by_user_parent",q => (
        q.eq("userId",userId).eq('parentDocument',documentId)
      ))
      .collect()
    
      for (const child of children) {
        await context.db.patch(child._id,{
          isArchived:true
        })
        await recursiveArchive(child._id)
      }
    }

    const document = await context.db.patch(args.id,{
      isArchived:true
    })

    recursiveArchive(args.id)

    return document
  }
})

export const getSidebar = query({
  args:{
    workspaceId: v.string(),
    parentDocument:v.optional(v.id("documents"))
  },
  handler:async (context,args) => {
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Not authenticated")
    }

    const userId = identity.subject

    const documents = await context.db
    .query("documents")
    .withIndex("by_workspace_parent", q =>
      q.eq("workspaceId", args.workspaceId).eq("parentDocument", args.parentDocument)
    )
    .filter(q => q.eq(q.field("isArchived"),false))
    .order('desc')
    .collect()

    return documents
  }
})

export const create = mutation({
  args:{
    title:v.string(),
    workspaceId: v.string(),
    parentDocument:v.optional(v.id('documents')),
    content: v.optional(v.string())
  },
  handler:async (context,args) => {
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const document = await context.db.insert('documents',{
      title:args.title,
      parentDocument:args.parentDocument,
      userId: identity.subject,
      isArchived:false,
      isPublished:false,
      workspaceId: args.workspaceId,
      content: args.content ?? ""
    })

    return document
  }
})

export const getTrash = query({
  args:{
    workspaceId: v.string(),
    parentDocument:v.optional(v.id("documents"))
  },
  handler:async (context, args) => {
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const documents = await context.db.query('documents')
    .withIndex("by_workspace_parent", q =>
      q.eq("workspaceId", args.workspaceId).eq("parentDocument", args.parentDocument)
    )
    .filter(q => q.eq(q.field('isArchived'),true))
    .order('desc')
    .collect()

    return documents
  }
})

export const restore = mutation({
  args:{id:v.id('documents')},
  handler: async (context,args) => {
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const existingDocument = await context.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const recursiveRestore = async (documentId:Id<'documents'>) => {
      const children = await context.db.query('documents')
      .withIndex('by_user_parent',q => (
        q.eq('userId',userId).eq('parentDocument',documentId)
      ))
      .collect()

      for (const child of children) {
        await context.db.patch(child._id,{
          isArchived:false
        })

        await recursiveRestore(child._id)
      }
    }

    const options:Partial<Doc<'documents'>> = {
      isArchived:false
    }

    if (existingDocument.parentDocument) {
      const parent = await context.db.get(existingDocument.parentDocument)
      if (parent?.isArchived) {
        options.parentDocument = undefined
      }
    }

    const document = await context.db.patch(args.id,options)

    recursiveRestore(args.id)

    return document
  }
})


export const remove = mutation({
  args:{id:v.id('documents')},
  handler:async (context,args) => {

    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject

    const existingDocument = await context.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const document = await context.db.delete(args.id)

    return document
  }
})

export const getSearch = query({
  args:{
    workspaceId: v.string(),
    parentDocument:v.optional(v.id("documents"))
  },
  handler:async (context, args) => {
   
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error('Not authenticated')
    }

    const userId = identity.subject
    
    const documents = await context.db.query('documents')
    .withIndex("by_workspace_parent", q =>
      q.eq("workspaceId", args.workspaceId).eq("parentDocument", args.parentDocument)
    )
    .filter(q => q.eq(q.field('isArchived'),false))
    .order('desc')
    .collect()

    return documents
  }
})

export const getById = query({
  args: {
    documentId: v.id("documents"),
    workspaceId: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const document = await ctx.db.get(args.documentId);

    if (!document || document.workspaceId !== args.workspaceId) {
      return null;
    }

    // 공개 문서는 누구나 볼 수 있음
    if (document.isPublished && !document.isArchived) {
      return document;
    }

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // ✅ 해당 워크스페이스의 멤버인지 확인
    const isMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", q =>
        q.eq("userId", userId).eq("workspaceId", document.workspaceId)
      )
      .first();

    if (!isMember) {
      throw new Error("Unauthorized");
    }

    return document;
  },
});



export const update = mutation({
  args:{
    id:v.id('documents'),
    title:v.optional(v.string()),
    content:v.optional(v.string()),
    coverImage:v.optional(v.string()),
    icon:v.optional(v.string()),
    isPublished:v.optional(v.boolean())
  },
  handler:async (context,args) => {
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const userId = identity.subject

    const {id,...rest} = args

    const existingDocument = await context.db.get(args.id)

    if (!existingDocument) {
      throw new Error("Not found")
    }

    if (existingDocument.userId !== userId) {
      throw new Error('Unauthorized')
    }

    const document = await context.db.patch(args.id,{
      ...rest
    })

    return document
  }
})


export const removeIcon = mutation({
  args:{id:v.id('documents')},
  handler:async (context,args) => {
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const userId = identity.subject

     const existingDocument = await context.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const document = await context.db.patch(args.id,{
      icon:undefined
    })

    return document
  } 
})

export const removeCoverImage = mutation({
  args:{id:v.id('documents')},
  handler:async (context,args) => {
    const identity = await context.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const userId = identity.subject

    const existingDocument = await context.db.get(args.id)

    if (!existingDocument) {
      throw new Error('Not found')
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const document = await context.db.patch(args.id,{
      coverImage:undefined
    })

    return document
  }
})