import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import { request } from "http";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

//회원 가입, 수정, 삭제가 이루어질때
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

//파일 전송
http.route({
  path: "/sendFile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Step 1: Store the file
    const blob = await request.blob();
    const storageId = await ctx.storage.store(blob);

    // Step 2: Save the storage ID to the database via a mutation
    const author = new URL(request.url).searchParams.get("author");
    const fileName = new URL(request.url).searchParams.get("fileName");
    const roomId = new URL(request.url).searchParams.get("roomId");
    const format = new URL(request.url).searchParams.get("format");
    const text = new URL(request.url).searchParams.get("text");
    if (!author || !fileName || !roomId || !format || !text) {
      //필요한 파라미터가 없을 경우 에러 응답 반환
      return new Response("요구된 파라미터가 없습니다.", {
        status: 400,
        headers: new Headers({
          "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
          Vary: "origin",
        })
      })
    }
      await ctx.runMutation(api.chat.sendFile, {
        storageId, author, fileName, roomId, format,text
      });

    // Step 3: Return a response with the correct CORS headers
    return new Response(null, {
      status: 200,
      // CORS headers
      headers: new Headers({
        // e.g. https://mywebsite.com, configured on your Convex dashboard
        "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
        Vary: "origin",
      }),
    });
  }),
});

// Pre-flight request for /sendImage
http.route({
  path: "/sendFile",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          // e.g. https://mywebsite.com, configured on your Convex dashboard
          "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

//파일 가져오기
http.route({
  path: "/getFile",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get("storageId")! as Id<"_storage">;
    const fileName = searchParams.get("fileName");

    const blob = await ctx.storage.get(storageId);
    if( blob === null) {
      return new Response("File not found", {
        status: 404,
      });
    }

    // Content-Disposition 헤더 설정
    const headers = new Headers();
    if(fileName) {
      //파일 이름에 특수 문자가 있을 경우를 대비해 인코딩
      const encodedFileName = encodeURIComponent(fileName);
      headers.set(
        "Content-Disposition", 
        `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
      );
    }
    return new Response(blob, { headers });
  }),
});

//유효한 요청인지
async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;