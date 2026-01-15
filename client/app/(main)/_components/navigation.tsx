"use client";

import { cn } from "@/lib/utils";
import {
  ChevronsLeft,
  MenuIcon,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Trash,
  User,
  UserPlus,
  X, // 모바일 닫기용 아이콘 추가
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import UserItem from "./user-item";
import { useMutation } from "convex/react";

import { useSearch } from "@/hooks/use-search";
import { useSettings } from "@/hooks/use-settings";
import { useInvite } from "@/hooks/use-invite";

import { api } from "@/convex/_generated/api";
import { Item } from "./item";
import { toast } from "sonner";
import { DocumentList } from "./workspace/document-list";
import { useMediaQuery } from "usehooks-ts";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { TrashBox } from "./trash-box";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Navbar } from "./navbar";
import InviteModal from "@/components/modals/invite-modal";
import Image from "next/image";

export const Navigation = () => {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { workspaceId } = params as { workspaceId?: string };
  const isWorkspacePath = pathname.startsWith("/workspace");

  const search = useSearch();
  const invite = useInvite();
  const settings = useSettings();
  const create = useMutation(api.documents.create);

  const sidebarRef = useRef<HTMLElement | null>(null);
  const navbarRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMediaQuery("(max-width:768px)");

  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [isResetting, setIsResetting] = useState(false);

  const MIN_WIDTH = 210;
  const MAX_WIDTH = 700;

  // 사이드바 토글 로직 (useCallback 최적화)
  const toggleSidebar = useCallback(() => {
    setIsResetting(true);
    setIsCollapsed((prev) => !prev);
    setTimeout(() => setIsResetting(false), 300);
  }, []);

  // 데스크탑 단축키 추가 (Ctrl + \ 또는 Cmd + \)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "\\" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleSidebar]);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);


  if (isWorkspacePath && !workspaceId) {
    return null;
  }

  const safeWorkspaceId = workspaceId!;

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarRef.current?.getBoundingClientRect().width || 240;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH && sidebarRef.current && navbarRef.current) {
        sidebarRef.current.style.width = `${newWidth}px`;
        navbarRef.current.style.left = `${newWidth}px`;
        navbarRef.current.style.width = `calc(100% - ${newWidth}px)`;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 중복 코드를 줄이기 위해 모바일일 때 사이드바를 닫아주는 헬퍼 함수
  const handleAction = (callback: () => void) => {
    callback(); // 원래 하려던 동작(검색창 열기 등) 실행
    if (isMobile) {
      toggleSidebar(); // 모바일이면 사이드바 닫기
    }
  };

  const handleCreate = () => {
    const promise = create({
      title: "Untitled",
      workspaceId: safeWorkspaceId,
    }).then((documentId) => {
      if (isMobile) toggleSidebar(); // 페이지 생성 후 모바일이면 닫기
      router.push(`/workspace/${workspaceId}/documents/${documentId}`);
    });

    toast.promise(promise, {
      loading: "새 노트 생성 중...",
      success: "새 노트가 생성되었습니다!",
      error: "새 노트 생성에 실패했습니다.",
    });
  };

  const onRedirectFriends = () => {
    router.push(`/workspace/${workspaceId}/friends`);
  }

  return (
    <>
      {/* 모바일용 백드롭 (배경 어둡게 및 클릭 시 닫기) */}
      {!isCollapsed && isMobile && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/60 z-[99998] backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar h-full bg-black overflow-y-auto relative flex flex-col z-[99999] md:rounded-r-xl",
          isCollapsed ? "w-0" : "w-full md:w-60",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "fixed inset-y-0 left-0 shadow-2xl"
        )}
      >
        <div className={cn(
          "w-full h-full flex flex-col transition-opacity duration-300",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <div className="p-4 flex items-center justify-between">
            <Image
              src="/logo-dark.png"
              width={176}
              height={48}
              alt="Logo"
              className="h-auto cursor-pointer hover:opacity-80 transition"
              onClick={() => router.push("/")}
            />
            {/* 4. 데스크탑 전용 접기 버튼 */}
            {!isMobile && (
              <div
                role="button"
                onClick={toggleSidebar}
                className="h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-800 opacity-0 group-hover/sidebar:opacity-100 transition cursor-pointer"
              >
                <ChevronsLeft className="h-6 w-6" />
              </div>
            )}
            {/* 5. 모바일 전용 큰 닫기 버튼 (X 아이콘) */}
            {isMobile && (
              <div
                onClick={toggleSidebar}
                role="button"
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-800 transition text-white absolute top-4 right-4"
              >
                <X className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* 터치 영역 최적화를 위해 모바일일 때 간격 조절 */}
          <div className={cn(isMobile && "px-2 space-y-2")}>
            <UserItem />
            <Item
              label="초대"
              icon={UserPlus}
              onClick={() => handleAction(invite.onOpen)}
            />
            {invite.isOpen && <InviteModal workspaceId={safeWorkspaceId} />}
            <Item
              label="검색"
              icon={Search}
              isSearch
              onClick={() => handleAction(search.onOpen)}
            />
            <Item
              label="설정"
              icon={Settings}
              onClick={() => handleAction(settings.onOpen)}
            />
            <Item onClick={handleCreate} label="새 페이지" icon={PlusCircle} />
          </div>

          <div className={cn("mt-4 text-white", isMobile && "px-2 space-y-2")}>
            <DocumentList onItemClick={() => isMobile && toggleSidebar()} />
            <Item onClick={handleCreate} label="페이지 추가" icon={Plus} />
            <Item
              icon={User}
              label="친구"
              onClick={() => handleAction(onRedirectFriends)}
            />
            <Popover>
              <PopoverTrigger className="w-full mt-4">
                <Item label="휴지통" icon={Trash} />
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-72"
                side={isMobile ? "bottom" : "right"}
              >
                <TrashBox />
              </PopoverContent>
            </Popover>
          </div>

          {/* 데스크탑 리사이즈 핸들 (모바일은 숨김) */}
          {!isMobile && (
            <div
              onMouseDown={handleMouseDown}
              className="cursor-ew-resize absolute h-full w-1 hover:bg-primary right-0 top-0 opacity-0 group-hover/sidebar:opacity-100 transition"
            />
          )}
        </div>
      </aside>

      <div
        ref={navbarRef}
        className={cn(
          "absolute top-0 z-[9998] pointer-events-none",
          isResetting && "transition-all ease-in-out duration-300",
          // 모바일일 때 사이드바가 열리면 내비바를 완전히 숨기거나 왼쪽으로 밀어줌
          isCollapsed ? "left-0 w-full" : isMobile ? "left-0 w-0 opacity-0" : "left-60 w-[calc(100%-240px)]"
        )}
      >
        {!!params.documentId ? (
          <Navbar isCollapsed={isCollapsed} onResetWidth={toggleSidebar} />
        ) : (
          <nav className="bg-transparent px-3 py-2 w-full">
            {isCollapsed && (
              <MenuIcon
                role="button"
                className="h-6 w-6 text-muted-foreground pointer-events-auto cursor-pointer hover:text-white transition"
                onClick={toggleSidebar}
              />
            )}
          </nav>
        )}
      </div>
    </>
  );
};