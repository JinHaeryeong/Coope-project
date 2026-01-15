"use client"
import { Suspense } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AnswerWrite from "@/app/(marketing)/_components/inquiries/answer-write";
import AnswerList from "@/app/(marketing)/_components/inquiries/answers";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarDays, Computer, MessageCircle, User } from "lucide-react";



const InquiryContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inquiryId = searchParams.get("inquiryId");
    const { user } = useUser();
    const deleteInquiry = useMutation(api.inquiries.deleteInquiry);
    const userRole = user?.publicMetadata?.role
    const [isanswerOpen, setIsanswerOpen] = useState(false);
    const inquiry = useQuery(api.inquiries.getInquiry, inquiryId ? { id: inquiryId } : "skip");
    if (!inquiryId) {
        return <p>문의 사항 ID가 유효하지 않습니다.</p>
    }

    if (inquiry === undefined) {
        return <p>로딩중 ..</p>;
    }

    if (!inquiry) {
        return <p>문의 사항이 존재하지 않습니다.</p>;
    }

    if (user?.id !== inquiry?.userId && userRole !== 'admin') {
        return <p>타인이 작성한 문의는 볼 수 없습니다.</p>
    }

    const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            await deleteInquiry({
                inquiryId: inquiry._id
            });

            if (userRole !== 'admin') {
                router.push("/customerService")
            } else {
                router.push("/csAdmin");
            }
        } catch (error: unknown) {
            console.log("에러..임");

            if (error instanceof Error) {
                console.log("상태 메세지:", error.message);
            }

            return
        }
    }

    const handleAnswer = () => {
        setIsanswerOpen((prev) => !prev);
    };

    const answerClose = () => { setIsanswerOpen(false) };

    return (
        <div className="px-4 md:px-12 min-h-full flex justify-center py-10">
            <div className="w-full max-w-7xl">
                <nav className="flex gap-2 mb-4 text-sm md:text-base text-slate-600 dark:text-slate-50">
                    <Link href="/" className="hover:text-primary">홈</Link>
                    <span>&gt;</span>
                    <Link href="/customerService" className="hover:text-primary">고객지원</Link>
                </nav>
                <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-5 break-all">{inquiry?.title}</h1>
                <div className="gap-2  flex flex-col sm:flex-row md:gap-5 text-sm md:text-lg mb-4 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2"><User size={18} />{inquiry.userName} 작성</div>
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
                        }).format(new Date(inquiry?._creationTime))}
                    </div>
                    <div className="gap-x-2 flex  items-center">
                        <MessageCircle size={18} />
                        문의 유형: {inquiry.category}
                    </div>
                    <div className="gap-x-2 flex  items-center">
                        <Computer size={18} />
                        환경: {inquiry.environment}
                    </div>

                </div>
                <div className="text-slate-700 text-base md:text-lg leading-relaxed dark:text-slate-200 break-words">
                    {inquiry?.content}
                </div>
                <div className="grid-col-3">
                    {inquiry.files && inquiry.files.map((file) =>
                        <div key={file._id}>
                            <h2 className="text-xl font-bold mb-2">첨부 파일</h2>
                            <h3>{file.fileName}</h3>
                            {file.url &&
                                <Link href={file.url} rel="noopener noreferrer" target="_blank">
                                    <Image
                                        loading="lazy"
                                        src={file.url}
                                        alt="첨부 이미지"
                                        width={500}
                                        height={500}
                                        style={{ cursor: 'pointer' }}
                                    /></Link>}
                        </div>
                    )}
                </div>

                {/* 작성자의 아이디와 현재 접속된 유저의 아이디가 같을 때만 나타나는 버튼*/}
                {(inquiry.userId === user?.id || userRole === 'admin') &&
                    <div className="text-right my-2">
                        {userRole === 'admin' &&
                            <Button variant="outline" className="mr-2" onClick={handleAnswer}>답변</Button>}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>삭제</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>문의를 삭제하시겠습니까?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        삭제된 문의는 복구되지 않습니다. 신중하게 생각하고 삭제해주세요.
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
                {isanswerOpen && <AnswerWrite inquiry={inquiryId as Id<"inquiryDetails">} onClose={answerClose} userEmail={inquiry.userEmail} userName={inquiry.userName} />}
                <hr />
                <div><h2 className="text-2xl font-bold my-2 box-content">답변</h2></div>
                <AnswerList postId={inquiryId} />
            </div>
        </div>
    );
}

export default function InquiryPage() {
    return (
        <Suspense fallback={<p>데이터를 불러오는 중...</p>}>
            <InquiryContent />
        </Suspense>
    );
}