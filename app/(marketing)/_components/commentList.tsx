import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { GenericId } from "convex/values";
import { SetStateAction, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
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
                            <Avatar>
                                <AvatarImage src={comment.authorImgUrl} alt="프로필이미지" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div className="speech-bubble dark:bg-neutral-900">
                                <div>{comment.author}</div>
                                <div className="font-medium">{comment.content}</div>
                                <div className="font-medium">{new Intl.DateTimeFormat('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                }).format(new Date(comment._creationTime))}</div>
                                {comment.authorId === user?.id &&
                                    <div className="text-right">
                                        <Button variant="ghost" className="h-3" onClick={() => handleEditButtonClick(comment._id, comment.content)}>수정</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" className="h-3">삭제</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>댓글을 삭제하시겠습니까?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        삭제된 댓글은 복구되지 않습니다. 신중하게 생각하고 삭제해주세요.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => handleDelete(comment._id, e)}>삭제</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>}
                                {
                                    //commentIdToEdit과 comment._id가 같을 때만 나타나게 하지않으면 모든 댓글 밑에 수정 칸이 나타날 수 있을 것 같아서 이렇게 했습니다.
                                    commentIdToEdit === comment._id && (
                                        <form onSubmit={handleCommentEdit} className="flex gap-2 w-full h-32" >
                                            <textarea
                                                name="content"
                                                value={commentEdit}
                                                onChange={editComment}
                                                placeholder="수정할 댓글 내용을 입력해주세요"
                                                required
                                                className="h-full w-full comment-textarea"
                                                maxLength={200}
                                            />
                                            <Button type="submit" className="h-full">등록</Button>
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