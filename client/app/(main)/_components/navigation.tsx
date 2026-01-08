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
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
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

  // 상태 초기값 설정
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [isResetting, setIsResetting] = useState(false);

  const MIN_WIDTH = 210;
  const MAX_WIDTH = 700;

  // 모바일 대응: 모바일일 경우 자동으로 사이드바 닫기
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  // 훅 아래에서 조건부 렌더링 처리
  if (isWorkspacePath && !workspaceId) {
    return null;
  }

  const safeWorkspaceId = workspaceId!;

  // 사이드바 드래그 조절 로직 (성능을 위해 직접 조작 유지하되 transition은 잠시 끔)
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

  // 핵심 수정: setInterval 제거 및 상태 기반 애니메이션
  const toggleSidebar = () => {
    setIsResetting(true);
    setIsCollapsed((prev) => !prev);

    // 애니메이션 시간(300ms) 후 transition 해제
    setTimeout(() => setIsResetting(false), 300);
  };

  const handleCreate = () => {
    const promise = create({
      title: "Untitled",
      workspaceId: safeWorkspaceId,
    }).then((documentId) =>
      router.push(`/workspace/${workspaceId}/documents/${documentId}`)
    );

    toast.promise(promise, {
      loading: "Creating a new note...",
      success: "New note created!",
      error: "Failed to create a new note.",
    });
  };

  const onRedirectFriends = () => {
    router.push(`/workspace/${workspaceId}/friends`);
  }

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar h-full bg-black overflow-y-auto relative flex flex-col z-[99999] rounded-r-xl",
          isCollapsed ? "w-0" : "w-60", // 상태에 따라 너비 제어
          isResetting && "transition-all ease-in-out duration-300", // 애니메이션 시에만 transition 적용
          isMobile && "fixed inset-y-0 left-0" // 모바일일 때 고정 레이아웃
        )}
      >
        {/* 내부 콘텐츠가 너비가 줄어들 때 깨지지 않도록 wrapper 추가 */}
        <div className={cn(
          "w-60 h-full flex flex-col transition-opacity duration-300",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <div className="p-4">
            <Image
              src="/logo-dark.png"
              width={176}
              height={48}
              alt="Logo"
              className="h-auto ml-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => router.push("/")}
            />
          </div>
          <div
            role="button"
            className="h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-800 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition"
            onClick={toggleSidebar}
          >
            <ChevronsLeft className="h-6 w-6" />
          </div>
          <div>
            <UserItem />
            <Item label="초대" icon={UserPlus} onClick={invite.onOpen} />
            {invite.isOpen && <InviteModal workspaceId={safeWorkspaceId} />}
            <Item label="검색" icon={Search} isSearch onClick={search.onOpen} />
            <Item label="설정" icon={Settings} onClick={settings.onOpen} />
            <Item onClick={handleCreate} label="새 페이지" icon={PlusCircle} />
          </div>
          <div className="mt-4 text-white">
            <DocumentList />
            <Item onClick={handleCreate} label="페이지 추가" icon={Plus} />
            <Item icon={User} label="친구" onClick={onRedirectFriends} />
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
          <div
            onMouseDown={handleMouseDown}
            className="cursor-ew-resize absolute h-full w-1 hover:bg-primary right-0 top-0"
          />
        </div>
      </aside>
      <div
        ref={navbarRef}
        className={cn(
          "absolute top-0 z-[9999] pointer-events-none",
          isResetting && "transition-all ease-in-out duration-300",
          isCollapsed ? "left-0 w-full" : "left-60 w-[calc(100%-240px)]"
        )}
      >
        {!!params.documentId ? (
          <Navbar isCollapsed={isCollapsed} onResetWidth={toggleSidebar} />
        ) : (
          <nav className="bg-transparent px-3 py-2 w-full">
            {isCollapsed && (
              <MenuIcon
                role="button"
                className="h-6 w-6 text-muted-foreground pointer-events-auto"
                onClick={toggleSidebar}
              />
            )}
          </nav>
        )}
      </div>
    </>
  );
};