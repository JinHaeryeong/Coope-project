import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // 선택 효과를 위해 shadcn에서 쓰는 cn 함수
import { FriendType } from "./friend";

interface FriendListItemProps {
    friend: FriendType;
    onClick: () => void;
    isSelected: boolean; // 선택된 상태인지 구분
}

const FriendListItem = ({ friend, onClick, isSelected }: FriendListItemProps) => {
    return (
        <>
            <div
                className={cn(
                    "font-medium flex items-center cursor-pointer hover:bg-gray-200 p-2 rounded-md transition",
                    isSelected && "bg-gray-200" // 현재 선택된 친구면 배경색 고정
                )}
                onClick={onClick}
            >
                <div>
                    <div>{friend.friendName}</div>
                    <div className="text-sm text-gray-600">{friend.friendEmail}</div>
                </div>

                <Avatar className="ml-auto">
                    <AvatarImage src={friend.friendIcon} alt="프로필이미지" />
                    <AvatarFallback>{friend.friendName?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
            </div>
            <Separator className="my-2" />
        </>
    );
};

export default FriendListItem;