import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { FC, useMemo } from "react";
import Image from "next/image";
import { GenericId } from "convex/values";
import { formatDate } from "@/lib/utils";
interface AnswersProp {
    postId: string
}

const AnswerList: FC<AnswersProp> = ({ postId }) => {
    const answers = useQuery(api.inquiries.listAnswer, { id: postId });
    const files = useQuery(api.inquiries.ListAnswerFiles, { inquiryId: postId });
    const deleteAnswer = useMutation(api.inquiries.deleteAnswer);
    const { user } = useUser();

    const combinedAnswers = useMemo(() => {
        if (!answers) return [];

        return answers.map(answer => ({
            ...answer,
            // 이 답변에 속한 파일들만 필터링해서 미리 넣어둠
            attachments: files?.filter(file => file.answerId === answer._id) || []
        }));
    }, [answers, files]);

    const handleDelete = async (id: GenericId<"inquiryAnswer">, e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await deleteAnswer({
                answerId: id
            });
        } catch (error: unknown) {
            console.log("답변 삭제 중 에러 발생");
            if (error instanceof Error) {
                console.log("상태 메세지: " + error.message);
            }
        }
    }
    return (
        <div className="space-y-4"> {/* 답변들 사이 간격 추가 */}
            {answers === undefined ? (
                <p>로딩중..</p>
            ) : combinedAnswers.length === 0 ? (
                <p>아직 답변이 도착하지 않았습니다.</p>
            ) : (
                <>
                    {combinedAnswers.map((answer) => (
                        <div key={answer._id} className="comment-box">
                            <div className="speech-bubble dark:bg-neutral-900 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                        <div className="font-bold text-sm md:text-base text-sky-600 dark:text-sky-400">관리자 답변</div>
                                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                                        <div className="text-[10px] md:text-sm text-slate-500 font-light dark:text-slate-400">
                                            {formatDate(answer._creationTime)}
                                        </div>
                                    </div>
                                </div>

                                <div className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                                    {answer.answer}
                                </div>

                                {/* [개선] 이미지 렌더링 영역 - attachments 사용 */}
                                {answer.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {answer.attachments.map((file) => (
                                            <div key={file._id} className="relative w-24 h-24 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                                                <Image
                                                    src={file.url!}
                                                    alt={file.fileName || "첨부 이미지"}
                                                    fill
                                                    className="object-cover hover:scale-105 transition"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {answer.authorId === user?.id && (
                                    <div className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-red-500 transition">삭제</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="w-[90vw] max-w-md rounded-lg">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>답변 삭제</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        삭제된 답변은 복구되지 않습니다. 정말 삭제하시겠습니까?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={(e) => handleDelete(answer._id, e)}
                                                    >
                                                        삭제
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

export default AnswerList;