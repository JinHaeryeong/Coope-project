"use client"

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { CommentForm } from "@/app/(marketing)/_components/commentForm";
import CommentList from "@/app/(marketing)/_components/commentList";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarDays, Eye, UserCog2 } from "lucide-react";
/*
    Next Js 13v 이후부터는 useRouter등의 기능을 next/routes가 아니라 next/navigation에서 가져와야한다.. 이걸 몰라서 고생했다
    UI 수정 필요
*/
const NoticePageContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const noticeId = searchParams.get("noticeId"); // 공지사항 ID로 데이터를 가져옴
    const deleteNotice = useMutation(api.notices.deleteNotice);
    const { user } = useUser();
    const notice = useQuery(api.notices.getById, noticeId ? { id: noticeId } : "skip");
    const incrementViews = useMutation(api.notices.incrementViews);

    useEffect(() => {
        if (!noticeId) return;

        const lastViewed = localStorage.getItem(`viewed_time_${noticeId}`); // 이 글을 마지막으로 본시간
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000; // 24시간

        if (!lastViewed || now - parseInt(lastViewed) > ONE_DAY) { // 글을 처음보거나, 마지막으로 본지 24시간이 지났으면
            incrementViews({ id: noticeId as Id<"notices"> });
            localStorage.setItem(`viewed_time_${noticeId}`, now.toString());
        }
    }, [noticeId, incrementViews]);

    if (!noticeId) { //null 체크, 없어도 사이트 자체는 돌아가지만 IDE에서는 계속 오류라고 표시됨
        return <p>공지사항 ID가 유효하지 않습니다.</p>
    }


    if (notice === undefined) {
        return <p>로딩 중...</p>;
    }

    if (!notice) {
        return <p>해당 공지사항을 찾을 수 없습니다.</p>;
    }

    //삭제 버튼 클릭후 나타나는 Alert Dialog에서도 삭제버튼을 눌렀을 때 실행됨
    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await deleteNotice({
                noticeId: noticeId
            });
            router.push("/notice");
        } catch (error: unknown) {
            console.log("공지사항 삭제 중 에러가 발생했습니다");
            if (error instanceof Error) {
                console.log("상태 메세지: ", error.message);
            }
            return
        }
    }

    return (
        <div className="px-4 md:px-12 min-h-full flex justify-center py-10">
            <div className="w-full max-w-7xl">
                <nav className="flex gap-2 mb-4 text-sm md:text-base text-slate-600 dark:text-slate-50">
                    <Link href="/" className="hover:text-primary">홈</Link>
                    <span>&gt;</span>
                    <Link href="/notice" className="hover:text-primary">공지사항</Link>
                </nav>
                <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-5 break-all">{notice.title}</h1>
                <div className="flex flex-col gap-2 sm:flex-row md:gap-5 text-sm md:text-lg mb-4 text-slate-600 dark:text-slate-400">
                    <div className="flex gap-2 items-center"><UserCog2 size={18} />관리자 작성</div>
                    <div className="flex gap-2 items-center">
                        <CalendarDays size={18} />
                        {new Intl.DateTimeFormat('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        }).format(new Date(notice._creationTime))}
                    </div>
                    <div className="flex gap-2 items-center">
                        <Eye size={18} />
                        {notice.views ?? 0} 조회수
                    </div>
                </div>
                <div className="text-slate-700 text-base md:text-lg leading-relaxed dark:text-slate-200 break-words">
                    {notice.content}
                </div>
                {notice.fileUrl && (
                    <div className="mt-4 md:mt-5">
                        <h2 className="text-xl font-bold mb-2">첨부 파일</h2>
                        <h3>{notice.fileName}</h3>
                        {notice.fileFormat?.startsWith('image/') ? (
                            <Image src={notice.fileUrl} alt="첨부 이미지" width="800" height="600" />
                        ) : (
                            <Link href={notice.fileUrl} download={notice.fileName} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                파일 다운로드
                            </Link>
                        )}
                    </div>
                )}
                {/* 작성자의 아이디와 현재 접속된 유저의 아이디가 같을 때만 나타나는 버튼*/}
                {(notice.authorId === user?.id) &&
                    <div className="text-right my-2">
                        {/* <Link key={notice._id}
                            href={{
                                pathname: '/noticeEditPage',
                                query: { notice: JSON.stringify(notice) },
                        }} */}
                        <Link key={notice._id}
                            href={{
                                pathname: '/noticeEditPage',
                                query: { noticeId: notice?._id },
                            }}
                        ><Button variant="outline" className="mr-2">수정</Button></Link>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>삭제</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>글을 삭제하시겠습니까?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        삭제된 글은 복구되지 않습니다. 신중하게 생각하고 삭제해주세요.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                }
                <hr />
                <div className="text-2xl font-bold my-2 box-content">댓글</div>
                <CommentForm notice={noticeId as Id<"notices">} />
                <CommentList notice={noticeId as Id<"notices">} />
            </div>
        </div>
    )
};

export default function NoticePage() {
    return (
        <Suspense fallback={<p>데이터를 불러오는 중...</p>}>
            <NoticePageContent />
        </Suspense>
    );
}