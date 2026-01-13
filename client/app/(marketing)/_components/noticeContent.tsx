"use client";

import React, { useEffect } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
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
} from "@/components/ui/pagination";
import { useUser } from "@clerk/clerk-react";
import { Clock, Loader2 } from "lucide-react";

const NoticeContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const noticesPerPage = 10;

    const currentPage = Number(searchParams.get("page")) || 1;

    const rawTotalCount = useQuery(api.notices.getTotalCount);
    const totalCount = rawTotalCount ?? 0;

    const { results, status, loadMore } = usePaginatedQuery(
        api.notices.getPaginated,
        {},
        { initialNumItems: noticesPerPage }
    );

    useEffect(() => {
        const neededItems = currentPage * noticesPerPage;
        if (results.length < neededItems && status === "CanLoadMore") {
            loadMore(neededItems - results.length);
        }
    }, [currentPage, results.length, status, loadMore]);

    const { user } = useUser();
    const userRole = user?.publicMetadata?.role;

    const paginatedNotices = results.slice(
        (currentPage - 1) * noticesPerPage,
        currentPage * noticesPerPage
    );

    const handlePageChange = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pageNumber.toString());
        router.push(`?${params.toString()}`);
    };

    const formatDateShort = (date: Date) => {
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(date);
    };

    const isNewNotice = (creationTime: number) => {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        return now - creationTime < oneDay;
    };

    const pageCount = rawTotalCount === undefined ? 1 : Math.max(Math.ceil(totalCount / noticesPerPage), 1);
    const isDataLoading = status === "LoadingFirstPage" || (status === "LoadingMore" && paginatedNotices.length === 0);

    return (
        <div className="min-h-screen flex flex-col pt-10 px-1 md:px-6 dark:bg-transparent">
            <div className="w-full max-w-full mx-auto flex flex-col items-center gap-y-10 flex-1 pb-20">
                <header className="space-y-4 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">공지사항</h1>
                    <p className="text-muted-foreground">새로운 소식과 업데이트를 확인하세요</p>
                </header>

                <div className="w-full rounded-lg shadow-sm border dark:border-slate-600 p-4 min-h-[500px] relative">
                    {isDataLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/50 z-10">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                            <p className="text-slate-400 font-medium">데이터 로딩 중...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-32 text-center flex flex-col items-center gap-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">작성된 공지사항이 없음.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px] md:w-[70px] text-center font-bold">번호</TableHead>
                                        <TableHead className="w-auto font-bold text-left">제목</TableHead>
                                        <TableHead className="hidden md:table-cell text-right w-[100px] font-bold">작성자</TableHead>
                                        <TableHead className="hidden lg:table-cell text-right w-[80px] font-bold">조회수</TableHead>
                                        <TableHead className="text-right w-[100px] md:w-[180px] font-bold">날짜</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedNotices.map((notice, index) => (
                                        <TableRow key={notice._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <TableCell className="text-center text-muted-foreground tabular-nums">
                                                {totalCount - ((currentPage - 1) * noticesPerPage) - index}
                                            </TableCell>
                                            <TableCell className="font-medium text-left">
                                                <div className="flex items-center gap-x-2">
                                                    <Link
                                                        href={`/noticePage?noticeId=${notice._id}`}
                                                        className="hover:underline text-slate-900 dark:text-slate-100"
                                                    >
                                                        {notice.title}
                                                    </Link>
                                                    {isNewNotice(notice._creationTime) && (
                                                        <span className="bg-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0">
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-right text-muted-foreground">{notice.author}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-right text-muted-foreground tabular-nums">{notice.views ?? 0}</TableCell>
                                            <TableCell className="text-right text-muted-foreground tabular-nums">
                                                <span className="hidden md:inline">{formatDateShort(new Date(notice._creationTime))}</span>
                                                <div className="flex flex-col items-end md:hidden gap-0.5">
                                                    <span className="text-[10px] text-slate-400">조회 {notice.views ?? 0}</span>
                                                    <span className="text-[11px]">{formatDateShort(new Date(notice._creationTime))}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-8 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) handlePageChange(currentPage - 1);
                                                }}
                                            />
                                        </PaginationItem>

                                        {Array.from({ length: pageCount }, (_, i) => i + 1)
                                            .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                                            .map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        href="#"
                                                        isActive={currentPage === page}
                                                        onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage < pageCount) handlePageChange(currentPage + 1);
                                                }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </>
                    )}
                </div>

                {userRole === 'admin' && (
                    <div className="flex justify-end w-full px-4">
                        <Link href="/admin">
                            <Button size="lg" className="px-8 shadow-md">글쓰기</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoticeContent;