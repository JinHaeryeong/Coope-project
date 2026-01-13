"use client"

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation, Pagination, Scrollbar, Autoplay } from "swiper/modules";
import { MailOpen, Github, ArrowRight } from "lucide-react";

// Swiper 스타일
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { Spinner } from "@/components/spinner";
import { useEnterWorkspace } from "@/hooks/use-enter-workspace"; // 커스텀 훅 임포트

const Introduction = () => {
    const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
    const { onEnter, isLoading: workspaceLoading } = useEnterWorkspace();
    const target = useRef<HTMLDivElement>(null);

    // 통합 로딩 상태 관리
    const isLoading = authLoading || workspaceLoading;

    const pagination = {
        clickable: true,
        renderBullet: function (index: number, className: string) {
            return '<span class="' + className + '">' + (index + 1) + '</span>';
        },
    };

    const teamMembers = [
        { id: 1, name: '김민재', role: '풀스택 개발', content: '팀 안전운전의 김민재입니다. 팀원 소개글의 1번입니다.', pic: '', git: 'https://github.com/codecodecode333' },
        { id: 2, name: '문제창', role: '풀스택 개발', content: '팀 안전운전의 문제창입니다. 팀원 소개글의 2번입니다.', pic: '', git: 'https://github.com/caiper007' },
        { id: 3, name: '진해령', role: '풀스택 개발', content: '팀 안전운전의 진해령입니다. 팀원 소개글의 3번입니다.', pic: '', git: 'https://github.com/JinHaeryeong' },
    ];

    useEffect(() => {
        if (!target.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("tracking-in-expand");
                } else {
                    entry.target.classList.remove("tracking-in-expand");
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(target.current);
        return () => observer.disconnect();
    }, [target]);

    return (
        <div className="min-h-screen pt-10 md:pt-20 overflow-x-hidden">
            <div className="flex flex-col items-center gap-y-8 pb-20">
                <div className="w-full max-w-[900px]">
                    <Image
                        src={"/introduction.webp"}
                        width={900}
                        height={300}
                        alt="사람"
                        priority
                    />
                </div>
                <div className="w-full px-10 md:px-40 flex flex-col">
                    <div ref={target} className="hidden-box">
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                            <span className="text-blue-500">함께</span> 알아가고<br />
                            창작하는 것을 돕습니다
                        </h2>
                        <p className="font-medium text-base md:text-lg mt-4 text-slate-600 dark:text-slate-400">
                            간단한 글 작성을 위한 공간부터 다양한 사람들이 <br className="hidden md:block" />
                            협업해야 하는 공간까지 우리는 모든 것을 제공합니다.
                        </p>

                        <div className="flex flex-wrap gap-3 my-8">
                            {isLoading ? (
                                <div className="w-40 flex items-center justify-center">
                                    <Spinner size="lg" />
                                </div>
                            ) : isAuthenticated ? (
                                <>
                                    <Button className="shadow-lg mr-2" onClick={onEnter}>
                                        시작하기
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                    <Button variant="outline">기능 둘러보기</Button>
                                </>
                            ) : (
                                <>
                                    <SignInButton mode="modal">
                                        <Button className="mr-2">
                                            Get Coope free
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </SignInButton>
                                    <Button variant="outline">문의하기</Button>
                                </>
                            )}
                        </div>

                        {/* Swiper 및 팀원 섹션 레이아웃 (기존과 동일) */}
                        <div className="relative w-full">
                            <div className="absolute -top-2 left-6 z-20">
                                <div className="absolute top-0 -left-[10px] w-[10px] h-[9px] bg-blue-900"
                                    style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}>
                                </div>
                                <div className="relative bg-blue-600 text-white px-2 pb-3 md:px-3 md:pt-3 md:pb-5 text-xs font-bold shadow-md clip-path-bookmark animate-bounce-subtle">
                                    PREVIEW
                                </div>
                            </div>
                            <Swiper
                                modules={[Navigation, Pagination, Scrollbar, A11y, Autoplay]}
                                spaceBetween={20}
                                slidesPerView={1}
                                navigation
                                pagination={pagination}
                                loop={true}
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                }}
                                className="mt-10 shadow-2xl rounded-2xl overflow-hidden aspect-video md:aspect-auto"
                            >
                                <SwiperSlide>
                                    <Image src="/example1.png" width={1900} height={800} alt="샘플1" />
                                </SwiperSlide>
                                <SwiperSlide>
                                    <Image src="/example2.png" width={1900} height={800} alt="샘플2" />
                                </SwiperSlide>
                                <SwiperSlide className="bg-muted flex items-center justify-center h-[400px]">Slide 3</SwiperSlide>
                                <SwiperSlide className="bg-muted flex items-center justify-center h-[400px]">Slide 4</SwiperSlide>
                            </Swiper>
                        </div>

                        {/* 팀원 섹션 */}
                        <div className="relative mt-24 md:mt-32 w-full">
                            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center md:text-start">팀원</h2>

                            {/* 데스크탑용 파란 줄: md 이상에서만 보이고 전체를 가로지름 */}
                            <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-64 pointer-events-none -rotate-2 z-0">
                                <Image
                                    src="/paint1.webp"
                                    fill
                                    priority
                                    className="object-cover opacity-95 dark:opacity-50 mix-blend-multiply dark:mix-blend-screen"
                                    sizes="100vw"
                                    alt="brush background"
                                />
                            </div>
                            {/* 뒤에 아주 옅은 글로우 효과만 (붓질을 돋보이게) */}
                            <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-40 bg-blue-500/5 blur-[100px] pointer-events-none -z-10" />

                            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-20 md:gap-10 justify-items-center pb-20 md:pb-40">
                                {teamMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="mt-16 relative shadow-lg w-64 h-96 border-2 border-gray-300 dark:border-gray-700 flex items-center flex-col hover:bg-blue-600 hover:text-white transition-all duration-300 rounded-xl bg-background/90 backdrop-blur-sm group"
                                    >
                                        {/* 모바일 전용 파란 줄: 각 카드 뒤에 배치 (md 미만에서만 보임) */}
                                        <div className="md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-32 bg-blue-500/10 blur-[60px] pointer-events-none -rotate-3 -z-10" />
                                        <div className="md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-20 bg-blue-600/15 skew-y-[-2deg] pointer-events-none border-y border-blue-400/[0.02] -z-10" />

                                        <div className="absolute -top-10">
                                            <Image
                                                src={"/universe.jpg"}
                                                className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md"
                                                alt="프로필"
                                                width={96}
                                                height={96}
                                            />
                                        </div>
                                        <div className="mt-16 flex items-center flex-col justify-center px-4">
                                            <h1 className="font-bold text-2xl mt-4 group-hover:text-white">{member.name}</h1>
                                            <p className="font-semibold text-xl text-blue-500 group-hover:text-blue-100">{member.role}</p>
                                            <p className="text-center mt-4 text-sm text-muted-foreground group-hover:text-white/90 leading-relaxed break-keep px-2">
                                                {member.content}
                                            </p>
                                        </div>
                                        <div className="flex flex-row space-x-6 mt-auto mb-8">
                                            <Link href="#" className="hover:scale-125 transition-transform"><MailOpen size={24} /></Link>
                                            <Link href={member.git} className="hover:scale-125 transition-transform"><Github size={24} /></Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Introduction;