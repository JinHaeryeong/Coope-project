import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";

const FriendRequestList = () => {
    const { user } = useUser();
    const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);

    if (!user) {
        return;
    }

    // 친구 요청 목록 가져오기
    const friendsRequest = useQuery(api.friends.getRequest, { id: user?.id });

    const handleAccept = async (friendRequestList: { userId: string; friendId: string; }) => {
        try {
            await acceptFriendRequest({
                userId: friendRequestList.userId,
                friendId: friendRequestList.friendId,
            });
        } catch (error) {
            console.log('나도 모르겠다:', error);
        }
    };

    return (
        <div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">요청 목록</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">친구 요청 목록</h4>
                            <p className="text-sm text-muted-foreground">
                                나에게 온 친구 요청 목록을 확인해보세요
                            </p>
                        </div>
                        <div className="grid gap-2">
                            {friendsRequest?.length === 0 ?
                                <div>
                                    <div className="font-medium">아직 나에게 온 친구 요청이 없어요🥲</div>
                                </div>
                                :
                                <div>
                                    {friendsRequest?.map((friendRequest) => (
                                        <div key={friendRequest._id}>
                                            <div className="userList-box">
                                                {/* 유저 정보 가져오기 */}
                                                <Avatar>
                                                    <AvatarImage src={friendRequest.userIcon} alt="프로필이미지" />
                                                    <AvatarFallback>CN</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{friendRequest.userName}</span>
                                                <span className="font-medium">{friendRequest.userEmail}</span>

                                                {/* 친구 요청 수락 버튼 */}
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAccept(friendRequest)}
                                                    className="add-button px-3"
                                                >
                                                    수락
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default FriendRequestList;
