"use client"

import React, { Suspense } from "react";
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
        <div className="mx-12 min-h-full flex justify-center py-10">
            <div className="h-full w-1/2">
                <h1 className="text-4xl font-bold mb-6">{notice.title}</h1>
                <h2 className="text-lg mb-4">{notice.author} 작성</h2>
                <h2 className="text-lg mb-4">
                    {new Intl.DateTimeFormat('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    }).format(new Date(notice._creationTime))}
                </h2>
                <div className="text-gray-700 text-lg leading-relaxed">
                    {notice.content}
                </div>
                {notice.fileUrl && (
                    <div className="mt-4">
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
                <CommentForm notice={noticeId} />
                <CommentList notice={noticeId} />
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