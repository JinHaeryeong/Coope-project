"use client";

import React, { useState, useMemo } from "react"; // useMemo 추가
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { Search, Trash, Undo } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/modals/confirm-modal";

export function TrashBox() {
  const router = useRouter();
  const params = useParams();
  const [search, setSearch] = useState("");
  const restore = useMutation(api.documents.restore);
  const remove = useMutation(api.documents.remove);

  const { workspaceId } = params as { workspaceId?: string };

  const documents = useQuery(
    api.documents.getTrash,
    workspaceId ? { workspaceId } : "skip"
  );

  // [성능 최적화] 검색 필터링 로직에 useMemo 적용
  // 검색어나 문서 목록이 바뀔 때만 연산을 수행합니다.
  const filteredDocuments = useMemo(() => {
    return documents?.filter((document) =>
      document.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [documents, search]);

  if (!workspaceId || typeof workspaceId !== "string") {
    console.log("하이드레이션 대기 중...");
    return null;
  }

  const onClick = (documentId: string) => {
    router.push(`/workspace/${workspaceId}/documents/${documentId}`);
  };

  const onRestore = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    documentId: Id<"documents">
  ) => {
    event.stopPropagation();

    const promise = restore({ id: documentId });

    toast.promise(promise, {
      loading: "노트를 복구하는 중...",
      success: "노트가 복구되었습니다!",
      error: "노트 복구에 실패했습니다.",
    });
  };

  const onRemove = (documentId: Id<"documents">) => {
    const promise = remove({ id: documentId });

    toast.promise(promise, {
      loading: "노트를 영구 삭제 중...",
      success: "노트가 완전히 삭제되었습니다!",
      error: "노트 삭제에 실패했습니다.",
    });

    if (params.documentId === documentId) {
      router.push(`/workspace/${workspaceId}/documents`);
    }
  };

  if (documents === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="w-4 h-4" />
        <Input
          className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="페이지 제목으로 검색..." // 한국어 변경
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        {/* 검색 결과가 없을 때 문구 한국어 변경 */}
        <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
          삭제된 문서가 없습니다.
        </p>
        {filteredDocuments?.map((document) => (
          <div
            className="text-sm rounded-sm w-full hover:bg-primary/5 flex justify-between items-center text-primary"
            key={document._id}
            role="button"
            onClick={() => onClick(document._id)}
          >
            <span className="truncate pl-2">{document.title}</span>
            <div className="flex items-center">
              {/* 복구 버튼 설명 추가 (선택사항) */}
              <div
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                onClick={(e) => onRestore(e, document._id)}
                title="복구하기"
              >
                <Undo className="w-4 h-4 text-muted-foreground" />
              </div>
              <ConfirmModal
                onConfirm={() => onRemove(document._id)}
                documentId={document._id}
                workspaceId={workspaceId}
              >
                <div
                  className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  role="button"
                  title="영구 삭제"
                >
                  <Trash className="w-4 h-4 text-muted-foreground" />
                </div>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}