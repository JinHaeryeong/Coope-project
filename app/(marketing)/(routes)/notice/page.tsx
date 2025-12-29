"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { useUser } from "@clerk/clerk-react";

const formatDate = (timeStamp: string | number | Date) => {
    const date = new Date(timeStamp);
    const formatter = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    return formatter.format(date);
};

const Notice = () => {
    const notices = useQuery(api.notices.get);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const noticesPerPage = 10;
    const { user } = useUser();
    const userRole = user?.publicMetadata?.role;

    // 데이터 슬라이스 및 정렬 로직은 그대로 유지
    const sortedNotices = notices ? [...notices].sort((a, b) => new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime()) : [];
    const paginatedNotices = sortedNotices.slice((currentPage - 1) * noticesPerPage, currentPage * noticesPerPage);
    const pageCount = notices ? Math.ceil(notices.length / noticesPerPage) : 1;

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        // min-h-screen과 justify-center로 수직 중앙 정렬 기반 마련
        <div className="min-h-screen flex flex-col justify-center">
            <div className="w-full max-w-full mx-auto flex flex-col items-center gap-y-10 px-6 box-border">

                {/* 제목 부분 */}
                <header className="space-y-2 text-center box-border">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">공지사항</h1>
                    <p className="text-muted-foreground">새로운 소식과 업데이트를 확인하세요</p>
                </header>

                <div className="w-full bg-white dark:bg-transparent rounded-lg shadow-sm border p-4">
                    {notices === undefined ? (
                        <div className="py-20 text-center">로딩 중...</div>
                    ) : notices.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">공지사항이 없습니다.</div>
                    ) : (
                        <>
                            <Table className="w-full">
                                {/* TableCaption은 테이블 하단에 위치하므로 제거하거나 위치 조정 */}
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[80px] text-center">번호</TableHead>
                                        <TableHead>제목</TableHead>
                                        <TableHead className="hidden md:table-cell text-center">작성자</TableHead>
                                        <TableHead className="text-right">날짜</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedNotices.map((notice, index) => (
                                        <TableRow key={notice._id} className="cursor-pointer transition-colors hover:bg-muted/50">
                                            <TableCell className="text-center text-muted-foreground">
                                                {notices.length - (currentPage - 1) * noticesPerPage - index}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={{ pathname: "/noticePage", query: { noticeId: notice._id } }}
                                                    className="block w-full"
                                                >
                                                    {notice.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-center">{notice.author}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {formatDate(notice._creationTime)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* 페이지네이션 */}
                            <div className="mt-8">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(currentPage - 1, 1)); }}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: pageCount }, (_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={currentPage === i + 1}
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(currentPage + 1, pageCount)); }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </>
                    )}
                </div>

                {/* 글쓰기 버튼 - 테이블 너비에 맞춰 정렬 */}
                {userRole === 'admin' && (
                    <div className="flex justify-end w-full">
                        <Link href="/admin">
                            <Button size="lg" className="px-8 shadow-md hover:shadow-lg transition-all">
                                글쓰기
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notice;
