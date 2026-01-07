'use client'

import { useParams, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import {
  DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { useMutation } from "convex/react"
import { ChevronDown, ChevronRight, LucideIcon, MoreHorizontal, Plus, Trash } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@clerk/clerk-react"




interface ItemProps {
  id?: Id<"documents">;
  documentIcon?: string;
  active?: boolean;
  expanded?: boolean;
  isSearch?: boolean;
  level?: number;
  onExpand?: () => void;
  label: string;
  onClick?: () => void;
  icon: LucideIcon;
};

export function Item({
  id,
  label,
  onClick,
  icon: Icon,
  active,
  documentIcon,
  isSearch,
  level = 0,
  onExpand,
  expanded
}: ItemProps) {

  const { user } = useUser()
  const router = useRouter()
  const create = useMutation(api.documents.create)
  const archive = useMutation(api.documents.archive)
  const { workspaceId } = useParams() as { workspaceId?: string };

  if (!workspaceId) {
    console.log("waiting for hydration...");
    return null;
  }

  const onArchive = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    if (!id) return
    const promise = archive({ id }).then(() => router.push(`/workspace/${workspaceId}/documents/${id}`));

    toast.promise(promise, {
      loading: "휴지통으로 옮기는중...",
      success: "노트가 휴지통으로 이동되었습니다!",
      error: "노트를 휴지통으로 이동하지 못했습니다."
    })
  }

  const handleExpand = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    onExpand?.()
  }

  const onCreate = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    if (!id) return
    const promise = create({ title: "Untitled", parentDocument: id, workspaceId: workspaceId, })
      .then((documentId) => {
        if (!expanded) {
          onExpand?.()
        }
        router.push(`/workspace/${workspaceId}/documents/${documentId}`);
      })

    toast.promise(promise, {
      loading: '노트 생성중...',
      success: '새 노트가 생성되었습니다!',
      error: '노트 생성에 실패했습니다.'
    })
  }

  const ChevronIcon = expanded ? ChevronDown : ChevronRight

  return (
    <div
      className={cn(
        "group min-h-[27px] text-sm py-1 pr-3 w-full flex items-center rounded-md transition",
        active
          ? "bg-[#191919] text-[#D1D1D1] font-semibold"
          : "text-muted-foreground hover:bg-[#292929] dark:hover:bg-[#292929]"
      )}
      onClick={onClick}
      role="button"
      style={{ paddingLeft: level ? `${(level * 12) + 12}px` : "12px" }}
    >
      {!!id && (
        <div className="h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 mr-1"
          onClick={handleExpand}
          role="button"
        >
          <ChevronIcon className="w-4 h-4 shrink-0 text-muted-foreground/50" />
        </div>
      )}
      {documentIcon ? (
        <div className="shrink-0 mr-2 text-[18px]">
          {documentIcon}
        </div>
      ) :
        <Icon className="mr-2 h-[1.125rem] w-[1.125rem] shrink-0 text-muted-foreground" />
      }
      <span className="truncate">
        {label}
      </span>
      {isSearch && (
        <kbd className="ml-auto pointer-events-none inline-flex gap-1 items-center h-5 select-none rounded border
        bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}

      {!!id && (
        <div className="ml-auto flex items-center gap-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild
              onClick={(e) => e.stopPropagation()}
            >
              <div className="opacity-0 group-hover:opacity-100 h-full ml-auto rounded-sm
              hover:bg-neutral-300 dark:hover:bg-neutral-600"
                role="button"
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60"
              align="start"
              side="right"
              forceMount
            >
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
          <div className="opacity-0 group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
            role="button" onClick={onCreate}>
            <Plus className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  )
}

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
  return (
    <div className="flex gap-x-2 py-[3px]" style={{ paddingLeft: level ? `${(level * 12) + 25}px` : '12px' }}>
      <Skeleton className="w-4 h-4" />
      <Skeleton className="w-4 h-[30%]" />
    </div>
  )
}