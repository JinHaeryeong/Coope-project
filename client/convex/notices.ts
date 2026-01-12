import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";


/**
 * 카운터 패턴 - 공지사항 개수 관리 헬퍼 함수
 * any 대신 MutationCtx 타입을 사용
 */
async function updateNoticeCount(ctx: MutationCtx, delta: number) {
  const metadata = await ctx.db.query("notices_metadata").unique();
  if (metadata) {
    const newCount = Math.max(0, metadata.count + delta);
    await ctx.db.patch(metadata._id, { count: newCount });
  } else {
    await ctx.db.insert("notices_metadata", { count: Math.max(0, delta) });
  }
}

/**
 * 성능 최적화 - 전체 개수 조회 쿼리
 * O(1) 성능을 보장하며, any 대신 QueryCtx를 사용
 */
export const getTotalCount = query({
  handler: async (ctx: QueryCtx) => {
    const metadata = await ctx.db.query("notices_metadata").unique();
    return metadata?.count ?? 0;
  },
});

//글쓰기로 notice 작성 후 게시 눌렀을 때
export const createNotice = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    storageId: v.optional(v.id("_storage")),
    author: v.string(),
    fileFormat: v.optional(v.string()),
    fileName: v.optional(v.string()),
    authorId: v.string(),
  },

  handler: async (ctx, args) => {
    const { title, content, author, storageId, fileFormat, fileName, authorId } = args;
    const notice = await ctx.db.insert("notices", { title, content, author, file: storageId, fileFormat, fileName, authorId, views: 0 });

    // 카운트 증가
    await updateNoticeCount(ctx, 1);
    return notice;
  },
});

// 조회수 증가
export const incrementViews = mutation({
  args: { id: v.id("notices") },
  handler: async (ctx, args) => {
    const notice = await ctx.db.get(args.id);
    if (notice) {
      await ctx.db.patch(args.id, {
        views: (notice.views ?? 0) + 1
      });
    }
  },
});

/**
 * 성능 최적화 - 서버 측 커서 기반 페이지네이션 쿼리
 * * @description
 * 기존 collect() 방식은 모든 데이터를 읽어 전송하므로 데이터 증가 시 성능이 선형적으로 저하됨
 * 본 함수는 Cursor 기반 방식을 사용하여 필요한 데이터만 효율적으로 조회
 * * - Cursor 방식: 마지막으로 읽은 데이터의 식별자를 기준으로 다음 n개만 조회 (O(1)에 가까운 성능)
 * - 오프셋 방식 대비 대용량 데이터셋에서 압도적인 속도와 전송량 이점을 가짐
 */
export const getPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notices")
      .order("desc") // 최신순 정렬 (B-Tree 인덱스 활용)
      .paginate(args.paginationOpts);
  },
});

//notices 전체 불러옴 (비교를 위해 남겨둠)
export const get = query(async (ctx) => {
  return await ctx.db.query("notices").collect();
});

export const getNoticeForComments = query({
  args: { id: v.id("notices") },
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

    if (notice.file && notice.file !== args.storageId) {
      await ctx.storage.delete(notice.file);
    }

    await ctx.db.patch(args.noticeId, { title: args.title, content: args.content, file: args.storageId, fileName: args.fileName, fileFormat: args.fileFormat });
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

    // 카운트 감소
    await updateNoticeCount(ctx, -1);

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

// 테스트용
export const seedNotices = mutation({
  args: {},
  handler: async (ctx) => {
    // 500개 정도로 늘려서 collect vs paginate의 차이보기
    for (let i = 1; i <= 500; i++) {
      await ctx.db.insert("notices", {
        title: `[TEST] ${i}번째 공지사항 제목입니다.`,
        content: `성능 테스트를 위한 본문 데이터입니다. `.repeat(10), // 본문 길이를 좀 늘려야 페이로드 차이가 잘보임
        author: "관리자",
        authorId: "admin_test_id",
        views: 0
      });
    }
    return "대량 데이터 생성 완료!";
  },
});

