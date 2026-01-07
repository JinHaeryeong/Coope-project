'use client'

import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/clerk-react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { MoreHorizontal, Trash } from "lucide-react"

import { Id } from "@/convex/_generated/dataModel"
import {
  DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"


interface MenuProps {
  documentId: Id<'documents'>
}

export function Menu({ documentId }: MenuProps) {
  const router = useRouter()
  const { user } = useUser()
  const archive = useMutation(api.documents.archive)
  const { workspaceId } = useParams() as { workspaceId?: string };
  if (!workspaceId) {
    console.log("waiting for hydration...");
    return null;
  }

  const onArchive = () => {
    const promise = archive({ id: documentId })

    toast.promise(promise, {
      loading: '휴지통으로 옮기는중...',
      success: "노트가 휴지통으로 이동되었습니다!",
      error: "노트를 휴지통으로 이동하지 못했습니다."
    })
    router.push(`/workspace/${workspaceId}/documents`);
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='sm' variant='ghost'>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" alignOffset={8} forceMount>
        <DropdownMenuItem onClick={onArchive}>
          <Trash className="w-4 h-4 mr-2" />
          삭제
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="text-xs text-muted-foreground p-2">
          마지막 수정자: {user?.fullName}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

Menu.Skeleton = function MenuSkeleton() {
  return (
    <Skeleton className="w-10 h-10" />
  )
}