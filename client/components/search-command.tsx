'use client'

import { File } from 'lucide-react'
import { useQuery } from "convex/react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/clerk-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useSearch } from "@/hooks/use-search"
import { api } from "@/convex/_generated/api"
import { useEffect, useState } from "react"
import { Doc } from '@/convex/_generated/dataModel'

export function SearchCommand() {
  const { user } = useUser()
  const router = useRouter()
  const { workspaceId } = useParams() as { workspaceId?: string }

  const [isMounted, setIsMounted] = useState(false)

  const toggle = useSearch(store => store.toggle)
  const isOpen = useSearch(store => store.isOpen)
  const onClose = useSearch(store => store.onClose)

  const documents = useQuery(
    api.documents.getSearch,
    workspaceId ? { workspaceId } : "skip"
  );

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle])

  if (!workspaceId) {
    console.log("waiting for hydration...")
    return null
  }
  const onSelect = (documentId: string) => {
    router.push(`/workspace/${workspaceId}/documents/${documentId}`)
    onClose()
  }

  if (!isMounted) return null

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder={`${user?.username}의 Coope에서 검색하기`} />
      <CommandList>
        <CommandEmpty>결과를 찾을 수 없습니다.</CommandEmpty>
        <CommandGroup heading="문서">
          {documents?.map((document: Doc<"documents">) => (
            <CommandItem
              key={document._id}
              value={`${document._id}-${document.title}`}
              title={document.title}
              onSelect={() => onSelect(document._id)}
            >
              {document.icon ? (
                <p className="mr-2 text-[18px]">
                  {document.icon}
                </p>
              ) : (
                <File className="w-4 h-4 mr-2" />
              )}
              <span>{document.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
