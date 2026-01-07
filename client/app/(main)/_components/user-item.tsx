"use client"

import { ChevronsLeftRight, Check, Plus } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "convex/react"

import { api } from "@/convex/_generated/api"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@clerk/clerk-react"
import { toast } from "sonner"
import { useState } from "react"

function UserItem() {
  const { user } = useUser()
  const router = useRouter()
  const { workspaceId } = useParams() as { workspaceId: string }
  const workspaces = useQuery(api.workspace.getMyWorkspaces)
  const createWorkspace = useMutation(api.workspace.createWorkspace)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("이름을 입력해주세요.")
      return
    }

    try {
      const newWorkspaceId = await createWorkspace({ name })
      setIsDialogOpen(false)
      toast.success("워크스페이스가 생성되었습니다.")
      router.push(`/workspace/${newWorkspaceId}/documents`)
    } catch (err) {
      console.error(err)
      toast.error("워크스페이스 생성 실패")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="button"
            className="flex items-center text-sm p-3 w-full hover:bg-primary/5"
          >
            <div className="gap-x-1 flex items-center max-w-[150px] ml-5">
              <Avatar className="h-5 w-5 rounded-[6px]">
                <AvatarImage src={user?.imageUrl} />
              </Avatar>
              <span className="text-start font-medium line-clamp-1 text-white">
                {user?.username}&apos;s Coope
              </span>
            </div>
            <ChevronsLeftRight className="rotate-90 ml-2 text-muted-foreground h-4 w-4" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="start" alignOffset={11} forceMount>
          <div className="flex flex-col space-y-4 p-2">
            <p className="text-xs font-medium leading-none text-muted-foreground">
              {user?.emailAddresses[0].emailAddress}
            </p>
            <div className="flex items-center gap-x-2">
              <div className="rounded-lg bg-secondary p-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.imageUrl} />
                </Avatar>
              </div>
              <div className="space-y-1">
                <p className="text-sm line-clamp-1">{user?.fullName}&apos;s Coope</p>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* 워크스페이스 리스트 */}
          {workspaces?.filter(Boolean).map((workspace) => (
            <DropdownMenuItem
              key={workspace!._id}
              onClick={() => router.push(`/workspace/${workspace!._id}/documents`)}
              className="cursor-pointer flex items-center justify-between"
            >
              <span className="truncate">{workspace!.name}</span>
              {workspace!._id === workspaceId && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}

          {/* 워크스페이스 생성 */}
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="cursor-pointer font-medium text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4 mr-2 text-primary" />
            새 워크스페이스 생성
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="w-full cursor-pointer text-muted-foreground" asChild>
            <SignOutButton>
              Log out
            </SignOutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 워크스페이스 생성 Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 워크스페이스 만들기</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="워크스페이스 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default UserItem
