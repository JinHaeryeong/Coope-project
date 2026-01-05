import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { FC } from "react";
import Image from "next/image";
import { GenericId } from "convex/values";
interface AnswersProp {
    postId: string
}

const AnswerList: FC<AnswersProp> = ({ postId }) => {
    const answers = useQuery(api.inquiries.listAnswer, { id: postId });
    const files = useQuery(api.inquiries.ListAnswerFiles, { inquiryId: postId });
    const deleteAnswer = useMutation(api.inquiries.deleteAnswer);
    const { user } = useUser();

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
        <div>
            {answers === undefined ? (
                <p>로딩중..</p>
            ) : answers.length === 0 ? (
                <p>아직 답변이 도착하지않았습니다.</p>
            ) : (
                <>
                    {answers.map((answer) => (
                        <div key={answer._id} className="comment-box">
                            <div className="speech-bubble dark:bg-neutral-900">
                                <div className="font-medium">{answer.answer}</div>
                                <div className="grid grid-flow-col">
                                    {files?.map((file) => (
                                        file.url && answer._id === file.answerId && <Image key={file._id} src={file.url} alt="머임" width={100} height={100} />
                                    ))}
                                </div>
                                <div className="font-medium">{new Intl.DateTimeFormat('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                }).format(new Date(answer._creationTime))
                                }</div>

                                {answer.authorId === user?.id &&
                                    <div className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" className="h-3">삭제</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>답변을 삭제하시겠습니까?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        삭제된 답변은 복구되지 않습니다. 신중하게 생각하고 삭제해주세요.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => handleDelete(answer._id, e)}>삭제</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>}

                            </div>

                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

export default AnswerList;