"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import {
    CheckCircle2,
    Clock,
    ChevronRight,
    Search,
    PlusCircle
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationEllipsis,
    PaginationNext,
    Pagination,
} from "@/components/ui/pagination";

const formatDate = (timeStamp: number) => {
    const date = new Date(timeStamp);
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
};

const CustomerService = () => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const noticesPerPage = 10;
    const { isAuthenticated } = useConvexAuth();
    const { user } = useUser();
    const router = useRouter();

    // 권한 및 사용자 정보
    const userRole = user?.publicMetadata?.role;
    const isAdmin = userRole === "admin";

    // 데이터 페칭 (통합)
    const inquiries = useQuery(
        api.inquiries.get,
        isAdmin ? {} : { userId: user?.id }
    );

    // 데이터 정렬 및 가공
    const sortedInquiries = inquiries
        ? [...inquiries].sort((a, b) => b._creationTime - a._creationTime)
        : [];

    const paginatedInquiries = sortedInquiries.slice(
        (currentPage - 1) * noticesPerPage,
        currentPage * noticesPerPage
    );

    const pageCount = Math.max(Math.ceil(sortedInquiries.length / noticesPerPage), 1);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleInquiryButton = () => {
        if (!isAuthenticated) {
            alert("문의를 작성하기 위해선 로그인을 해야합니다.");
            return;
        }
        router.push("/inquiryWrite");
    };

    return (
        <div className="min-h-screen flex flex-col pt-10 px-1 md:px-6 bg-slate-50/30 dark:bg-transparent">
            <div className="w-full max-w-full mx-auto flex flex-col items-center gap-y-10 flex-1 pb-20">

                {/* 헤더 섹션 */}
                <header className="space-y-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        {isAdmin ? "문의 관리 시스템" : "내 문의 내역"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto break-keep leading-relaxed">
                        {isAdmin
                            ? "접수된 사용자 문의를 확인하고 답변을 관리하는 관리자 전용 공간입니다."
                            : "Coope 서비스 이용 중 발생한 불편사항이나 궁금한 점을 확인하세요."}
                    </p>
                    <div className="inline-flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-2">
                        <Search className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Support Center</span>
                    </div>
                </header>

                {/* 메인 리스트 카드 */}
                <div className="w-full bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {inquiries === undefined ? (
                        <div className="py-32 text-center animate-pulse flex flex-col items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <p className="text-slate-400 font-medium text-lg">데이터 로딩 중...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="py-32 text-center flex flex-col items-center gap-4">
                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                                <Clock className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">작성된 문의 내역이 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                    <TableRow>
                                        <TableHead className="w-[70px] text-center font-bold">번호</TableHead>
                                        <TableHead className="font-bold">문의 내용</TableHead>
                                        {/* 데스크탑 전용 컬럼들 */}
                                        {isAdmin && <TableHead className="hidden md:table-cell w-[140px] text-center font-bold">작성자</TableHead>}
                                        <TableHead className="hidden md:table-cell w-[120px] text-center font-bold">처리 상태</TableHead>
                                        <TableHead className="w-[120px] md:w-[150px] text-right font-bold pr-6">등록일</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedInquiries.map((inquiry, index) => (
                                        <TableRow
                                            key={inquiry._id}
                                            className="group transition-colors hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-default"
                                        >
                                            <TableCell className="text-center text-slate-400 text-sm font-medium">
                                                {sortedInquiries.length - (currentPage - 1) * noticesPerPage - index}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-y-1.5 py-1">
                                                    <Link
                                                        className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                                        href={{
                                                            pathname: "/inquiryPage",
                                                            query: { inquiryId: inquiry._id },
                                                        }}
                                                    >
                                                        <span className="line-clamp-1">{inquiry.title}</span>
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-500" />
                                                    </Link>

                                                    {/* 모바일 전용 상세 정보 배지 */}
                                                    <div className="flex items-center gap-x-2 md:hidden">
                                                        {inquiry.responseStatus ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> 답변완료
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">
                                                                <Clock className="w-3 h-3 mr-1" /> 대기중
                                                            </span>
                                                        )}
                                                        {isAdmin && <span className="text-[11px] text-slate-400 font-medium">| {inquiry.userName}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* 데스크탑: 작성자 (관리자만) */}
                                            {isAdmin && (
                                                <TableCell className="hidden md:table-cell text-center">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{inquiry.userName}</span>
                                                </TableCell>
                                            )}

                                            {/* 데스크탑: 상태 배지 (모두 확인 가능) */}
                                            <TableCell className="hidden md:table-cell text-center">
                                                {inquiry.responseStatus ? (
                                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold ring-1 ring-inset ring-blue-700/10">
                                                        <CheckCircle2 className="w-3 h-3 mr-1.5" /> 답변완료
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold ring-1 ring-inset ring-slate-500/10">
                                                        <Clock className="w-3 h-3 mr-1.5" /> 답변대기
                                                    </div>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right text-slate-400 text-xs md:text-sm font-medium pr-6 tabular-nums">
                                                {formatDate(inquiry._creationTime)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* 페이지네이션 섹션 */}
                            <div className="py-8 bg-slate-50/50 dark:bg-slate-800/30 flex justify-center border-t border-slate-100 dark:border-slate-800">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(currentPage - 1, 1)) }}
                                            />
                                        </PaginationItem>

                                        {Array.from({ length: pageCount }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === pageCount || Math.abs(p - currentPage) <= 1)
                                            .map((page, i, arr) => (
                                                <React.Fragment key={page}>
                                                    {i > 0 && arr[i - 1] !== page - 1 && (
                                                        <PaginationItem><PaginationEllipsis /></PaginationItem>
                                                    )}
                                                    <PaginationItem>
                                                        <PaginationLink
                                                            href="#"
                                                            isActive={currentPage === page}
                                                            onClick={(e) => { e.preventDefault(); handlePageChange(page) }}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                </React.Fragment>
                                            ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(currentPage + 1, pageCount)) }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </>
                    )}
                </div>

                {/* 하단 액션 버튼 */}
                {!isAdmin && (
                    <div className="flex justify-end w-full">
                        <Button
                            onClick={handleInquiryButton}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none px-8 py-6 rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            새로운 문의 작성
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerService;