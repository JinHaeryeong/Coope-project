import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";


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
    const notice = await ctx.db.insert("notices", { title, content, author, file: storageId, fileFormat, fileName, authorId });
    return notice;
  },
});

/**
 * [성능 최적화] 서버 측 페이지네이션 적용 쿼리
 * 500개를 한꺼번에 가져오던 기존 get 대신, 필요한 양만큼만 Cursor 기반으로 조회
 * 
 * 
 * 
 * 
Cursor 개념을 사용한다.
Cursor란 사용자에게 응답해준 마지막의 데이터의 식별자 값이 Cursor가 된다.

해당 Cursor를 기준으로 다음 n개의 데이터를 응답해주는 방식이다.

쉽게 말로 비교하면

오프셋 기반 방식

1억번~1억+10번 데이터 주세요. 라고 한다면 → 1억+10번개의 데이터를 읽음
커서 기반 방식

마지막으로 읽은 데이터(1억번)의 다음 데이터(1억+1번) 부터 10개의 데이터 주세요
→ 10개의 데이터만 읽음
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
      });
    }
    return "대량 데이터 생성 완료!";
  },
});
