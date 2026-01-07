import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { SetStateAction, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

export const CommentForm = ({ notice }: { notice: Id<"notices"> }) => {
    const [content, setContent] = useState(''); //처음에 comment로 했을 때 오류가 나서 얘가 문제 일줄 알고 이름 content로 바꿈 -> 근데 얘 이름은 문제가 아니었다
    const { user } = useUser();
    const addComment = useMutation(api.comments.addComment);
    const inputComment = (e: { target: { value: SetStateAction<string>; }; }) => {
        setContent(e.target.value);
    }
    const handleComment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (!user.username) {
            alert('유저가 존재하지않습니다');
            return;
        }
        if (!notice) {
            alert('공지사항이 존재하지않습니다.')
            return;
        }
        try {

            await addComment({
                content,
                author: user?.username,
                authorId: user?.id,
                postId: notice,
                authorImgUrl: user?.imageUrl
            });
            setContent('');
        } catch (error: unknown) {
            console.log('댓글 작성중 오류발생')
            if (error instanceof Error) {
                console.log("상태 메세지: " + error.message);
            }
        }
    }
    return (
        <div className="flex w-full items-center space-x-2">
            <form onSubmit={handleComment} className="flex gap-2 w-full h-32" >
                <textarea
                    name="content"
                    value={content}
                    onChange={inputComment}
                    placeholder="댓글을 입력해주세요"
                    required
                    className="h-full w-full comment-textarea"
                    maxLength={200}
                />
                <Button type="submit" className="h-full">등록</Button>
            </form>
        </div>
    );
}

