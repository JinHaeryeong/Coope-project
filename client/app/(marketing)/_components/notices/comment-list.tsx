import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { GenericId } from "convex/values";
import { SetStateAction, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { formatDate } from "@/lib/utils";
export const CommentList = ({ notice }: { notice: string }) => {
    const comments = useQuery(api.comments.listComments, { id: notice });
    const [commentEdit, setCommentEdit] = useState(""); //댓글 수정 내용을 담아둠
    const [commentIdToEdit, setCommentIdToEdit] = useState<Id<"comments"> | null>(null);//수정할 comment의 id를 저장하기 위해
    const { user } = useUser();
    const deleteComment = useMutation(api.comments.deleteComment);
    const editedComment = useMutation(api.comments.editComment);

    //삭제 버튼 클릭후 나타나는 Alert Dialog에서도 삭제버튼을 눌렀을 때 실행됨
    const handleDelete = async (id: GenericId<"comments">, e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await deleteComment({
                commentId: id
            });
        } catch (error: unknown) {
            console.log("댓글 삭제 중 오류 발생");
            if (error instanceof Error) {
                console.log("상태 메세지: " + error.message);
            }
        }
    }

    const handleEditButtonClick = (id: GenericId<"comments">, content: string) => {
        setCommentIdToEdit(id);
        setCommentEdit(content);
    }

    const editComment = (e: { target: { value: SetStateAction<string>; }; }) => {
        setCommentEdit(e.target.value)
    }

    const handleCommentEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!commentIdToEdit) {
            alert('수정할 코멘트가 없습니다.')
            return;
        }
        try {

            await editedComment({
                id: commentIdToEdit,
                content: commentEdit
            });
            setCommentIdToEdit(null);
        } catch (error: unknown) {
            console.log('댓글 작성중 오류발생')
            if (error instanceof Error) {
                console.log("상태 메세지: " + error.message);
            }
        }
    }
    return (
        <div>
            {comments === undefined ? (
                <p>로딩중..</p>
            ) : comments.length === 0 ? (
                <p>댓글이 없습니다.</p>
            ) : (
                <>
                    {comments.map((comment) => (
                        <div key={comment._id} className="comment-box">
                            <Avatar className="w-8 h-8 md:w-10 md:h-10 shrink-0">
                                <AvatarImage src={comment.authorImgUrl} alt="프로필이미지" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div className="speech-bubble dark:bg-neutral-900 flex-1">
                                {/* 헤더 부분: 이름, 날짜, 수정/삭제 버튼 */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                        <div className="font-bold text-sm md:text-base">{comment.author}</div>
                                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                                        <div className="text-[10px] md:text-sm text-slate-500 font-light">
                                            {formatDate(comment._creationTime)}
                                        </div>
                                    </div>

                                    {/* 버튼 영역: 터치 영역 확보 */}
                                    {comment.authorId === user?.id && (
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                variant="ghost"
                                                className="h-6 px-2 text-[10px] md:text-sm"
                                                onClick={() => handleEditButtonClick(comment._id, comment.content)}
                                            >
                                                수정
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" className="h-6 px-2 text-[10px] md:text-sm">삭제</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="w-[90vw] max-w-md rounded-lg">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                                                        <AlertDialogDescription>삭제된 댓글은 복구되지 않습니다.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>취소</AlertDialogCancel>
                                                        <AlertDialogAction onClick={(e) => handleDelete(comment._id, e)}>삭제</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                                <div className="font-medium mt-2">{comment.content}</div>

                                {commentIdToEdit === comment._id && (
                                    <form onSubmit={handleCommentEdit} className="flex flex-col gap-2 mt-4 w-full">
                                        <textarea
                                            name="content"
                                            value={commentEdit}
                                            onChange={editComment}
                                            placeholder="수정할 댓글 내용을 입력해주세요"
                                            required
                                            className="min-h-[100px] w-full comment-textarea"
                                            maxLength={200}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setCommentIdToEdit(null)}
                                            >
                                                취소
                                            </Button>
                                            <Button type="submit">등록</Button>
                                        </div>
                                    </form>
                                )}
                            </div>

                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

export default CommentList;