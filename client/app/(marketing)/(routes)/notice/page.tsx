"use client";

import React, { useState } from "react";
// 핵심: usePaginatedQuery로 변경
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
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
    const noticesPerPage = 10;

    // 서버 측 페이지네이션 쿼리 호출
    // results: 현재까지 로드된 데이터 리스트
    // status: 로딩 상태
    // loadMore: 다음 데이터를 더 불러오는 함수
    const { results, status, loadMore } = usePaginatedQuery(
        api.notices.getPaginated, // 아까 서버에 만든 함수
        {},
        { initialNumItems: noticesPerPage }
    );

    const [currentPage, setCurrentPage] = useState<number>(1);
    const { user } = useUser();
    const userRole = user?.publicMetadata?.role;

    // 2. 현재 페이지에 맞는 데이터를 보여주는 로직
    // usePaginatedQuery는 데이터를 누적해서 가져오므로 slice가 필요함
    const paginatedNotices = results.slice(
        (currentPage - 1) * noticesPerPage,
        currentPage * noticesPerPage
    );

    // 3. 페이지 변경 핸들러 (데이터가 부족하면 서버에 더 요청)
    const handlePageChange = (pageNumber: number) => {
        // 현재 로드된 데이터 기준으로 마지막 페이지 계산
        const lastLoadedPage = Math.ceil(results.length / noticesPerPage);

        // 다음 페이지 데이터가 없으면 서버에서 더 가져옴
        if (pageNumber > lastLoadedPage && status !== "Exhausted") {
            loadMore(noticesPerPage);
        }
        setCurrentPage(pageNumber);
    };

    // 전체 페이지 수 계산 (Convex PaginatedQuery는 전체 개수를 미리 알기 어려우므로 
    // 실제 서비스에서는 전체 개수를 리턴하는 별도 쿼리를 쓰거나, '다음' 버튼으로만 제어함)
    // 여기서는 테스트를 위해 현재 로드된 기준으로 계산하거나 고정값 사용
    const pageCount = Math.max(Math.ceil(results.length / noticesPerPage), 1);

    return (
        <div className="min-h-screen flex flex-col pt-10">
            <div className="w-full max-w-full mx-auto flex flex-col items-center gap-y-10 px-6 box-border">
                <header className="space-y-2 text-center box-border">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">공지사항</h1>
                    <p className="text-muted-foreground">새로운 소식과 업데이트를 확인하세요</p>
                </header>

                <div className="w-full bg-white dark:bg-transparent rounded-lg shadow-sm border p-4">
                    {status === "LoadingFirstPage" ? (
                        <div className="py-20 text-center">로딩 중...</div>
                    ) : results.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">공지사항이 없습니다.</div>
                    ) : (
                        <>
                            <Table className="w-full">
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
                                                {/* 번호 계산 로직 (전체 개수를 모를 경우 index로 표시) */}
                                                {results.length - (currentPage - 1) * noticesPerPage - index}
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

                            <div className="mt-8">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(currentPage - 1, 1)); }}
                                            />
                                        </PaginationItem>

                                        {/* 슬라이딩 윈도우 UI 적용 */}
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
                                                    // 안전장치 추가
                                                    // 더 이상 데이터가 없고(Exhausted) 현재가 마지막 로드된 페이지라면 이동 차단
                                                    const lastLoadedPage = Math.ceil(results.length / noticesPerPage);
                                                    if (status === "Exhausted" && currentPage >= lastLoadedPage) {
                                                        return;
                                                    }
                                                    handlePageChange(currentPage + 1);
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