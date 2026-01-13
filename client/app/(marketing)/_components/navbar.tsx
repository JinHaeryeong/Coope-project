"use client"

import { useScrollTop } from "@/hooks/use-scroll-top";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import Link from "next/link";
import { Spinner } from "@/components/spinner";
import { useConvexAuth } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react"; // X 아이콘 추가해서 닫기 버튼 시각화
import dynamic from "next/dynamic";

const SignInButton = dynamic(() => import("@clerk/clerk-react").then(mod => mod.SignInButton), { ssr: false });
const UserButton = dynamic(() => import("@clerk/clerk-react").then(mod => mod.UserButton), { ssr: false });
const ModeToggle = dynamic(() => import("@/components/mode-toggle").then(mod => mod.ModeToggle), {
    ssr: false,
    loading: () => <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md" /> // 로딩 중 스켈레톤
});

const Links = [
    { href: "/notice", text: '공지사항' },
    { href: "/introduction", text: '회사소개' },
    { href: "/support", text: '고객지원' },
]

export const Navbar = () => {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const scrolled = useScrollTop();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }

    return (
        <div className={cn(
            "z-50 bg-background dark:bg-[#1F1F1F] sticky top-0 flex items-center w-full",
            scrolled && "border-b shadow-sm"
        )}>
            {/* 상단 바 본체 - 배경색을 명시하고 z-index를 높게 설정하여 오버레이가 침범 못하게 함 */}
            <div className="relative z-[60] flex items-center justify-between w-full p-2 md:p-6 bg-background dark:bg-[#1F1F1F]">
                <Link href="/"><Logo /></Link>

                <div className="md:ml-auto md:justify-end justify-between flex items-center gap-x-10">
                    {/* 데스크톱 nav */}
                    <nav className="hidden md:flex">
                        <ul className="flex space-x-4 gap-x-10">
                            {Links.map((link) => (
                                <li key={link.href} className="relative group font-medium">
                                    <Link href={link.href} className="capitalize">
                                        {link.text}
                                    </Link>
                                    <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-black dark:bg-white"></span>
                                </li>
                            ))}
                            {isLoading && <Spinner />}
                            {!isAuthenticated && !isLoading && (
                                <li className="relative group text-sm font-medium">
                                    <SignInButton mode="modal">
                                        <button>로그인</button>
                                    </SignInButton>
                                    <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-black dark:bg-white"></span>
                                </li>
                            )}
                        </ul>
                    </nav>

                    {/* 데스크톱 우측 버튼 (인증된 경우 UserButton, 테마 토글) */}
                    <div className="hidden md:flex items-center gap-x-10">
                        {isAuthenticated && !isLoading && (
                            <UserButton />
                        )}
                        <ModeToggle />
                    </div>

                    {/* 모바일 햄버거 버튼 */}
                    <Button
                        onClick={toggleMobileMenu}
                        variant="ghost"
                        size="sm"
                        className="md:hidden ml-auto p-2"
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* 모바일 메뉴 오버레이 및 리스트 */}
            {/* 모바일 메뉴를 닫기 위한 오버레이(검은 배경)에 클릭 이벤트만 있고 키보드 사용자를 위한 배려가 없다는 지적을 코파일럿에게 받음
            시각 장애인이 키보드로 조작할 때도 메뉴를 닫을 수 있게 속성을 추가 */}
            {isMobileMenuOpen && (
                <>
                    {/* 오버레이 (배경 어둡게) - 상단바(z-60)보다 낮은 z-40으로 설정 */}
                    <div
                        className="fixed inset-0 bg-black/40 md:hidden"
                        style={{ zIndex: 40 }}
                        onClick={toggleMobileMenu}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
                                toggleMobileMenu();
                            }
                        }}
                    />

                    {/* 드롭다운 메뉴 - 상단바 바로 아래 위치 */}
                    <nav
                        className="absolute top-full left-0 w-full bg-background dark:bg-[#1F1F1F] border-b shadow-xl md:hidden p-6 animate-in slide-in-from-top-5 duration-200"
                        style={{ zIndex: 55 }}
                    >
                        <ul className="flex flex-col space-y-4">
                            {Links.map((link) => (
                                <li key={link.href} className="text-lg font-medium" onClick={toggleMobileMenu}>
                                    <Link href={link.href} className="capitalize block w-full">
                                        {link.text}
                                    </Link>
                                </li>
                            ))}
                            <hr className="dark:border-slate-700" />
                            {isLoading && (
                                <li><Spinner /></li>
                            )}
                            {!isAuthenticated && !isLoading && (
                                <li className="text-lg font-medium">
                                    <SignInButton mode="modal">
                                        <span className="block w-full cursor-pointer" onClick={toggleMobileMenu}>로그인</span>
                                    </SignInButton>
                                </li>
                            )}
                            {isAuthenticated && !isLoading && (
                                <li className="flex items-center gap-x-2 text-lg font-medium">
                                    <UserButton />
                                </li>
                            )}
                            <li className="flex items-center justify-between pt-2">
                                <ModeToggle />
                            </li>
                        </ul>
                    </nav>
                </>
            )}
        </div>
    )
}