"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext, Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";

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

const CustomerServiceAdmin = () => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const noticesPerPage = 10;
    const { isAuthenticated } = useConvexAuth();
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!user?.id) {
            return;
        }
    }, [user, router]);

    const inquiries = useQuery(api.inquiries.getInquiries);

    const paginatedNotices = inquiries ? inquiries.slice((currentPage - 1) * noticesPerPage, currentPage * noticesPerPage) : [];

    const pageCount = inquiries ? Math.ceil(inquiries.length / noticesPerPage) : 1;

    if (inquiries !== undefined) {
        inquiries.sort((a, b) => new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime());
    }

    const handlePageChange = (pageNumber: React.SetStateAction<number>) => {
        setCurrentPage(pageNumber);
    };

    const handleInquiryButton = () => {
        if (!isAuthenticated) {
            alert('문의를 작성하기 위해선 로그인을 해야합니다.');
            return;
        }
        router.push("/inquiryWrite");
    }

    return (
        <div className="min-h-full flex flex-col">
            <div className="flex w-full flex-col items-center md:justify-start text-center gap-y-8 flex-1 px-6 pb-10">
                <h1 className="text-4xl font-bold">문의 내역</h1>

                <div className="w-10/12 rounded">
                    {inquiries === undefined ? (
                        <p>로딩 중...</p>
                    ) : inquiries.length === 0 ? (
                        <p>문의 내역이 없습니다.</p>
                    ) : (
                        <>
                            <Table className="w-full">
                                <TableCaption>이용자의 불편 해소를 위해 노력하겠습니다. 감사합니다.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">번호</TableHead>
                                        <TableHead>제목</TableHead>
                                        <TableHead>작성자</TableHead>
                                        <TableHead className="text-right">날짜</TableHead>
                                    </TableRow>
                                </TableHeader>
                                {paginatedNotices.map((inquiry, index) => (
                                    <TableBody key={inquiry._id} className="font-semibold">
                                        <TableRow>
                                            <TableCell className="text-left">{inquiries.length - (currentPage - 1) * noticesPerPage - index}</TableCell>
                                            <TableCell className="text-left">
                                                <Link className="cursor-pointer" href={{
                                                    pathname: "/inquiryPage",
                                                    query: { inquiryId: inquiry._id },
                                                }}>{inquiry.responseStatus && <span className="text-blue-700">[답변완료] </span>}{inquiry.title}</Link>
                                            </TableCell>
                                            <TableCell className="text-left">{inquiry.userName}</TableCell>
                                            <TableCell className="text-right">{formatDate(inquiry._creationTime)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                ))}
                            </Table>

                            <Pagination className="flex justify-center mt-4">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious href="#" onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} />
                                    </PaginationItem>
                                    {Array.from({ length: pageCount }, (_, index) => (
                                        <PaginationItem key={index}>
                                            <PaginationLink
                                                href="#"
                                                isActive={currentPage === index + 1}
                                                onClick={() => handlePageChange(index + 1)}
                                            >
                                                {index + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    {currentPage < pageCount - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                                    <PaginationItem>
                                        <PaginationNext href="#" onClick={() => handlePageChange(Math.min(currentPage + 1, pageCount))} />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </>
                    )}
                </div>

                <div className="flex justify-end w-10/12">
                    <Button onClick={handleInquiryButton}>
                        문의 작성
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CustomerServiceAdmin;
