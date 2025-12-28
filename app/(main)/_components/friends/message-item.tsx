// _components/friends/message-item.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

interface MessageItemProps {
    message: any; // 구체적인 Message 타입을 쓰기
    isMine: boolean;
    isSameSender: boolean;
    friendInfo: { name?: string; icon?: string };
    convexSiteUrl?: string;
}

export const MessageItem = ({
    message,
    isMine,
    isSameSender,
    friendInfo,
    convexSiteUrl
}: MessageItemProps) => {
    const formattedTime = new Intl.DateTimeFormat("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(message._creationTime));

    return (
        <article className={isMine ? "message-mine shadow-lg w-fit ml-auto rounded-lg my-3" : "shadow-lg w-fit rounded-lg my-3"}>
            {!isSameSender && !isMine && (
                <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-9 w-9 border ml-2">
                        <AvatarImage src={friendInfo.icon} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="text-base font-semibold">{friendInfo.name}</div>
                </div>
            )}

            {!isSameSender && isMine && <div className="text-right text-base font-semibold">나</div>}

            <div className="px-3">
                {message.file && (
                    <div className="mt-2">
                        {message.format?.startsWith("image/") ? (
                            <Image src={`${convexSiteUrl}/getFile?storageId=${message.file}`} width={200} height={200} alt="file" className="rounded-md" />
                        ) : (
                            <a href={`${convexSiteUrl}/getFile?storageId=${message.file}`} className="flex items-center p-2 bg-gray-100 rounded-md text-sm">
                                📎 {message.fileName || "파일 다운로드"}
                            </a>
                        )}
                    </div>
                )}
                <div className="py-2 text-base">{message.text}</div>
                <div className="text-sm opacity-50 pb-2">{formattedTime}</div>
            </div>
        </article>
    );
};