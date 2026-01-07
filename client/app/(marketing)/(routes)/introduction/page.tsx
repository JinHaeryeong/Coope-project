"use client"

import React, { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation, Pagination, Scrollbar } from "swiper/modules";
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";


const Introduction = () => {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const target = useRef<HTMLDivElement>(null);
    const { workspaceId } = useParams() as { workspaceId: string };
    const pagination = {
        clickable: true,
        renderBullet: function (index: number, className: string) {
            return '<span class="' + className + '">' + (index + 1) + '</span>';
        },
    };
    const teamMembers = [
        { id: 1, name: '김민재', role: '풀스택 개발', content: '팀 안전운전의 팀장 김민재입니다. 팀원 소개글의 1번입니다.' },
        { id: 2, name: '문제창', role: '풀스택 개발', content: '팀 안전운전의 팀원 문제창입니다. 팀원 소개글의 2번입니다.' },
        { id: 3, name: '진해령', role: '풀스택 개발', content: '팀 안전운전의 팀원 진해령입니다. 팀원 소개글의 3번입니다.' },
    ]

    useEffect(() => {
        if (!target.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("tracking-in-expand"); // 애니메이션 클래스 추가
                } else {
                    entry.target.classList.remove("tracking-in-expand"); // 다시 제거
                }
            },
            { threshold: 0.1 } // 50% 보일 때 트리거
        );

        observer.observe(target.current);

        return () => observer.disconnect(); // 클린업
    }, [target]);

    return (
        <div className="min-h-full flex flex-col">
            <div className="flex flex-col items-center justify-center
              md:justify-start text-center gap-y-8 flex-1 px-6 pb-10">
                {/* <div className="mountain-image">
                    <Image
                        src={"/mountain.jpg"}
                        fill
                        alt="산"
                        className="rounded-lg opacity-90 z-0"
                    />
                    <Image
                        src={"/moon.png"}
                        width={200}
                        height={200}
                        alt="달"
                        className="z-30 bottom-0 absolute left-52 top-3/4"
                    />
                </div> */}
                <Image
                    src={"/introduction.png"}
                    width={900}
                    height={300}
                    alt="사람"
                />

                <div className="w-full px-56 flex-col">
                    <h2 className="text-right text-blue-500 pb-10 text-sm">Designed by Freepik</h2>
                    <div ref={target} className="hidden-box">
                        <h2 className="text-5xl text-start"><span className="text-blue-500">함께</span> 알아가고<br /> 창작하는 것을 돕습니다</h2>
                        <h2 className="text-start font-medium text-lg">간단한 글 작성을 위한 공간부터 다양한 사람들이 협업해야하는 공간까지 <br />
                            우리는 모든 것을 제공합니다.</h2>
                        {isAuthenticated && !isLoading && (
                            <div className="text-start my-2">
                                <Button asChild className="shadow-lg mr-2">
                                    <Link href={`/workspace/${workspaceId}/documents`}>
                                        Coope 시작하기
                                    </Link>
                                </Button>
                                <Button variant="outline">무슨 기능을 추가할지 모르겠지만 일단 버튼</Button>
                            </div>
                        )}
                        {!isAuthenticated && !isLoading && (
                            <div className="text-start my-2">
                                <SignInButton mode="modal">
                                    <Button>
                                        Get Coope free
                                    </Button>
                                </SignInButton>
                                <Button variant="outline">무슨 기능을 추가할지 모르겠지만 일단 버튼</Button>
                            </div>
                        )}
                        {/* carousel 나중에 고치기*/}
                        <Swiper
                            modules={[Navigation, Pagination, Scrollbar, A11y]}
                            spaceBetween={50}
                            slidesPerView={1}
                            navigation
                            pagination={pagination}
                            scrollbar={{ draggable: true }}
                            onSwiper={(swiper) => console.log(swiper)}
                            onSlideChange={() => console.log('slide change')}
                            className="mt-5 shadow-2xl rounded-2xl"
                        >
                            <SwiperSlide>
                                <Image src="/example1.png"
                                    width={1900}
                                    height={800}
                                    alt="샘플1"
                                    loading="lazy"
                                />
                            </SwiperSlide>
                            <SwiperSlide>
                                <Image src="/example2.png"
                                    width={1900}
                                    height={800}
                                    alt="샘플1"
                                    loading="lazy"
                                />
                            </SwiperSlide>
                            <SwiperSlide>Slide 3</SwiperSlide>
                            <SwiperSlide>Slide 4</SwiperSlide>
                        </Swiper>
                        <h2 className="pt-20 text-4xl">팀원</h2>
                        <div className="grid grid-flow-col items-center justify-center">
                            {teamMembers.map((member) => (
                                <div key={member.id} className="mt-20 mr-5 max-h-screen relative shadow-lg w-60 h-96 border-2 border-gray-500 flex items-center  flex-col hover:bg-blue-600 hover:text-white rounded-lg">
                                    <div className="absolute -top-10">
                                        <Image src={"/universe.jpg"}
                                            className="h-24 w-24 rounded-full object-cover"
                                            alt="프로필사진"
                                            width={96}
                                            height={96} />
                                    </div>
                                    <div className="mt-16 flex items-center flex-col justify-center">
                                        <h1 className="font-bold text-2xl mt-4">{member.name}</h1>
                                        <p className="font-semibold text-xl text-gray-500">{member.role}</p>
                                        <p className="text-center mt-4">{member.content}</p>
                                    </div>
                                    <div className="flex flex-row space-x-4 mt-11">
                                        <Link href="#">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="bi bi-envelope-fill" viewBox="0 0 16 16">
                                                <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586zm3.436-.586L16 11.801V4.697z" />
                                            </svg>
                                        </Link>
                                        <Link href="#">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="bi bi-github" viewBox="0 0 16 16">
                                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                                            </svg>
                                        </Link>
                                        <Link href="#">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="bi bi-linkedin" viewBox="0 0 16 16">
                                                <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default Introduction;