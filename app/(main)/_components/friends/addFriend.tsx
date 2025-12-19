import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, UserSearch } from "lucide-react";
import { Input } from "@/components/ui/input"
import UserList from "./userList";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
const AddFriend = () => {
  const [searchUser, setSearchUser] = useState("");
  const [clickSearchUser, setClickSearchUser] = useState(false);
  // const searchedUser = useQuery(api.users.getUser, { id: searchUser });

  const handleSearchFriend = () => {
    if (!searchUser) {
      return;
    }
    setClickSearchUser(true);
  };

  const searchUserChange = (e: any) => {
    setSearchUser(e.target.value);
  };

  const handleState = () => {
    setClickSearchUser(false);
    setSearchUser("");
  };

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            친구 추가
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>친구 찾기</DialogTitle>
            <DialogDescription>
              검색을 통해 친구를 찾아볼까요?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                placeholder="친구의 닉네임을 입력하세요"
                value={searchUser}
                onChange={searchUserChange}
              />
            </div>
            <Button type="button" className="px-3" onClick={handleSearchFriend} >
              <UserSearch />
            </Button>
          </div>
          {
            clickSearchUser ?
              <UserList userId={searchUser} /> : <span className="font-medium">입력된 값이 없습니다.</span>
          }
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={handleState}>
                닫기
              </Button>
            </DialogClose >
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddFriend;