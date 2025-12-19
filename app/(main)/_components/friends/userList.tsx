import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Avatar } from "@/components/ui/avatar";
import { useConvex, useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { UserRoundPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const UserList = ({ userId }: { userId: string }) => {
  const userList = useQuery(api.users.getUser, { id: userId });
  const { user } = useUser();

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);

  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setErrorMessage("");
    setShowError(false);
  }, [userId]);

  if (!user) {
    return null;
  }

  if (!userList) {

    return <span>그런 유저는 없어요 :/</span>;
  }
  const handleAddFriend = async () => {
    console.log("친구 추가 시도:", user.id, userList.externalId);
    try {
    const response = await sendFriendRequest({
      userId: user.id,
      friendId: userList.externalId,
    });
      console.log("친구 추가 응답:", response);
    if (!response.success && response.message) {
      // 에러 메시지를 설정하고 표시
      setErrorMessage(response.message);
      setShowError(true);
    } else {
      // 성공 시 에러를 숨기기
      setShowError(false);
      //toast를 통해 친구 요청을 보낼 시 이용자가 요청을 보낸 것을 UI적으로 알 수 있도록 하기 위함
      toast("친구 요청을 보냈습니다.", {
        description: "친구가 요청을 수락 시 함께 대화를 나눌 수 있습니다 :)",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      }
    } catch (err) {
      console.error("친구 추가 에러:", err);
      setErrorMessage("친구 추가 중 오류가 발생했습니다.");
      setShowError(true);
    }
  };


  return (
    <div>
      {userList === undefined ? (
        <span className="font-medium">로딩 중...</span> // 데이터가 로딩 중일 때 표시
      ) : !userList ? (
        <span className="font-medium">그런 유저는 존재하지 않아요</span> // 유저가 없는 경우 표시
      ) : userList.externalId === user.id ?
        <span>본인은 친구로 추가할 수 없어요</span>
        : (
          <div >
            <div className="userList-box">
              <Avatar>
                <AvatarImage src={userList.userIcon} alt="프로필이미지" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span className="font-medium">{userList.name}</span>
              <span className="font-medium">{userList.email}</span>
              <Button type="button" onClick={handleAddFriend} className="add-button px-3"><UserRoundPlus /></Button>
            </div>
            {showError && <div className="font-medium">{errorMessage}</div>}
          </div>

        )}
    </div>

  );
}

export default UserList;