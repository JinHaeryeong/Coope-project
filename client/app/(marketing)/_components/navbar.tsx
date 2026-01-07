"use client"

import { useScrollTop } from "@/hooks/use-scroll-top";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { Spinner } from "@/components/spinner";
import { SignInButton, UserButton } from '@clerk/clerk-react';  // useClerk 훅 사용
import { useConvexAuth } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

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
            "z-50 bg-background dark:bg-[#1F1F1F] sticky top-0 flex items-center w-full p-6",
            scrolled && "border-b shadow-sm"
        )}>
            <Link href="/"><Logo /></Link>
            <div className="md:ml-auto md:justify-end
            justify-between w-full flex items-center gap-x-10">
                {/* 햄버거 메뉴 아이콘(모바일에서만 보임) */}
                <Button onClick={toggleMobileMenu} variant={"ghost"}
                    className="md:hidden ml-auto p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Menu />
                </Button>
                {/* 데스크톱 nav */}
                <nav className="hidden md:flex">
                    <div>
                        <ul className="flex space-x-4 gap-x-10">
                            {
                                Links.map((link) => (
                                    <li key={link.href} className="relative group">
                                        <Link href={link.href} className="capitalize">
                                            {link.text}
                                        </Link>
                                        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-black"></span>
                                    </li>

                                ))
                            }
                            {isLoading && (
                                <Spinner />
                            )}
                            {!isAuthenticated && !isLoading && (
                                <>
                                    <li className="relative group">
                                        <SignInButton mode="modal">
                                            로그인
                                        </SignInButton>
                                        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-black"></span>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </nav>
                {/* 모바일 nav */}
                {isMobileMenuOpen && (
                    <nav className="absolute top-full left-0 w-full bg-background dark:bg-[#1F1F1F] border-b shadow-sm md:hidden p-6">
                        <ul className="flex flex-col space-y-4">
                            {
                                Links.map((link) => (
                                    <li key={link.href} className="relative group" onClick={toggleMobileMenu}>
                                        <Link href={link.href} className="capitalize">
                                            {link.text}
                                        </Link>
                                        <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-black"></span>
                                    </li>
                                ))
                            }
                            {isLoading && (
                                <li><Spinner /></li>
                            )}
                            {!isAuthenticated && !isLoading && (
                                <li>
                                    <SignInButton mode="modal">
                                        <span onClick={toggleMobileMenu}>로그인</span>
                                    </SignInButton>
                                </li>
                            )}
                            {isAuthenticated && !isLoading && (
                                <li>
                                    <UserButton />
                                </li>
                            )}
                            <li>
                                <ModeToggle />
                            </li>
                        </ul>
                    </nav>
                )}
                <div className="hidden md:flex items-center gap-x-2"> {/* 데스크톱에서만 보이도록 hidden md:flex 추가 */}
                    {isAuthenticated && !isLoading && (
                        <UserButton />
                    )}
                </div>
                {<div className="hidden md:flex gap-x-2">
                    <ModeToggle />
                </div>
                }
            </div>
        </div>
    )
}