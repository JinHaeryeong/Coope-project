import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server'
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/noticeEditPage(.*)', '/answerWrite(.*)', '/csAdmin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const session = await auth(); // 관리자 루트일 때만 호출
    if (session.sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};