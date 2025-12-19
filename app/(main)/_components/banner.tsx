'use client'

import { useParams, useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { toast } from 'sonner'

import { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/modals/confirm-modal"

interface BannerProps {
  documentId: Id<'documents'>
}

export function Banner({ documentId }: BannerProps) {
  const { workspaceId } = useParams() as { workspaceId?: string };
  const router = useRouter()

  const remove = useMutation(api.documents.remove)
  const restore = useMutation(api.documents.restore)
  if (!workspaceId) {
    console.log("waiting for hydration...");
    return null;
  }
  const onRemove = () => {
    const promise = remove({ id: documentId })

    toast.promise(promise, {
      loading: '노트 삭제중...',
      success: '노트가 삭제되었습니다!',
      error: '노트 삭제에 실패했습니다.'
    })

    promise.then(() => {
      router.push(`/workspace/${workspaceId}/documents`);
    });
  }

  const onRestore = () => {
    const promise = restore({ id: documentId })

    toast.promise(promise, {
      loading: '노트 복원중...',
      success: '노트가 복원되었습니다!',
      error: '노트 복원에 실패했습니다.'
    })
  }

  return (
    <div className="w-full bg-rose-500 text-center text-sm p-2 text-white flex gap-x-2 justify-center items-center">
      <p>이 페이지는 휴지통에 있습니다.</p>
      <Button className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2
      h-auto font-normal" variant='outline' size='sm' onClick={onRestore}>
        페이지 복원
      </Button>
      <ConfirmModal onConfirm={onRemove} documentId={documentId} workspaceId={workspaceId}>
        <Button className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2
      h-auto font-normal" variant='outline' size='sm'>
          영구 삭제
        </Button>
      </ConfirmModal>
    </div>
  )
}