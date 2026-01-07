"use client"

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation, Pagination, Scrollbar, Autoplay } from "swiper/modules";
import { MailOpen, Github } from "lucide-react"; // 필요한 아이콘 임포트

// Swiper 스타일
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { useEnterWorkspace } from "@/hooks/use-enter-workspace";

const Introduction = () => {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const { onEnter, isLoading: workspaceLoading } = useEnterWorkspace();
    const target = useRef<HTMLDivElement>(null);

    const pagination = {
        clickable: true,
        renderBullet: function (index: number, className: string) {
            return '<span class="' + className + '">' + (index + 1) + '</span>';
        },
    };

    const teamMembers = [
        { id: 1, name: '김민재', role: '풀스택 개발', content: '팀 안전운전의 김민재입니다. 팀원 소개글의 1번입니다.' },
        { id: 2, name: '문제창', role: '풀스택 개발', content: '팀 안전운전의 문제창입니다. 팀원 소개글의 2번입니다.' },
        { id: 3, name: '진해령', role: '풀스택 개발', content: '팀 안전운전의 진해령입니다. 팀원 소개글의 3번입니다.' },
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
        <div className="min-h-screen flex flex-col pt-20">
            <div className="flex flex-col items-center justify-start text-center gap-y-8 flex-1 px-6">
                <Image
                    src={"/introduction.png"}
                    width={900}
                    height={300}
                    alt="사람"
                    priority
                />

                <div className="w-full px-10 md:px-56 flex flex-col">
                    <h2 className="text-right text-blue-500 pb-10 text-sm">Designed by Freepik</h2>

                    <div ref={target} className="hidden-box">
                        <h2 className="text-5xl text-start font-bold">
                            <span className="text-blue-500">함께</span> 알아가고<br />
                            창작하는 것을 돕습니다
                        </h2>
                        <h2 className="text-start font-medium text-lg mt-4">
                            간단한 글 작성을 위한 공간부터 다양한 사람들이 협업해야하는 공간까지 <br />
                            우리는 모든 것을 제공합니다.
                        </h2>

                        <div className="text-start my-6">
                            {isAuthenticated && !isLoading ? (
                                <>
                                    <Button className="shadow-lg mr-2" onClick={onEnter}>
                                        Coope 시작하기
                                    </Button>
                                    <Button variant="outline">기능 둘러보기</Button>
                                </>
                            ) : !isLoading && (
                                <>
                                    <SignInButton mode="modal">
                                        <Button className="mr-2">Get Coope free</Button>
                                    </SignInButton>
                                    <Button variant="outline">문의하기</Button>
                                </>
                            )}
                        </div>

                        {/* Swiper: 자동 슬라이드 적용 */}
                        <Swiper
                            modules={[Navigation, Pagination, Scrollbar, A11y, Autoplay]}
                            spaceBetween={50}
                            slidesPerView={1}
                            navigation
                            pagination={pagination}
                            loop={true}
                            autoplay={{
                                delay: 3000,
                                disableOnInteraction: false,
                            }}
                            className="mt-10 shadow-2xl rounded-2xl overflow-hidden"
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

                        {/* 팀원 섹션: 파란색 붓칠 효과 포함 */}
                        <div className="relative mt-32 w-full">
                            <h2 className="text-4xl font-bold mb-10 text-center md:text-start">팀원</h2>

                            {/* 배경 붓칠 효과 레이어: 부모의 패딩을 무시하고 화면 끝까지 확장 */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-40 bg-blue-500/10 blur-[100px] pointer-events-none -rotate-3" />

                            {/* 실제 붓칠 띠 느낌 */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-28 bg-blue-600/20 skew-y-[-2deg] pointer-events-none border-y border-blue-400/10" />

                            {/* 카드 그리드 */}
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 justify-items-center pb-40">
                                {teamMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="mt-16 relative shadow-lg w-64 h-96 border-2 border-gray-300 dark:border-gray-700 flex items-center flex-col hover:bg-blue-600 hover:text-white transition-all duration-300 rounded-xl bg-background/90 backdrop-blur-sm group"
                                    >
                                        {/* 카드 내용 (기존과 동일) */}
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
                                            <p className="text-center mt-4 text-sm text-muted-foreground group-hover:text-white/90 leading-relaxed">{member.content}</p>
                                        </div>
                                        <div className="flex flex-row space-x-6 mt-auto mb-8">
                                            <Link href="#" className="hover:scale-125 transition-transform"><MailOpen size={24} /></Link>
                                            <Link href="#" className="hover:scale-125 transition-transform"><Github size={24} /></Link>
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