"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { usePathname } from "next/navigation" // 경로 파악을 위한 훅 추가
import { cn } from "@/lib/utils" // Shadcn UI를 쓰신다면 보통 있는 클래스 합치기 유틸
import Modal from "./modal";
import Policy from "./policy";
import Terms from "./term";

export const Footer = () => {
    const pathname = usePathname(); // 현재 경로 가져오기
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

    // 메인 페이지(/)일 때만 fixed, 그 외에는 relative 또는 sticky 적용
    const isMainPage = pathname === "/";

    const openTermsModal = () => setIsTermsModalOpen(true);
    const closeTermsModal = () => setIsTermsModalOpen(false);
    const openPrivacyModal = () => setIsPrivacyModalOpen(true);
    const closePrivacyModal = () => setIsPrivacyModalOpen(false);

    return (
        <div className={cn(
            "flex items-center w-full p-3 bg-background z-49 dark:bg-[#1F1F1F] rounded-t-2xl",
            // 조건부 클래스 할당
            isMainPage ? "fixed bottom-0" : "relative mt-auto"
            // 'relative mt-auto'를 쓰면 전체 레이아웃 바닥에 자연스럽게 붙습니다.
        )}>
            <div className="md:ml-auto w-full justify-between md:justify-end flex items-center gap-x-2 text-muted-foreground">
                <Button variant="ghost" size="sm" onClick={openPrivacyModal}>
                    개인정보정책
                </Button>
                <Modal isOpen={isPrivacyModalOpen} onClose={closePrivacyModal} title="개인정보 정책">
                    <Policy />
                </Modal>
                <Button variant="ghost" size="sm" onClick={openTermsModal}>
                    이용약관
                </Button>
                <Modal isOpen={isTermsModalOpen} onClose={closeTermsModal} title="이용약관">
                    <Terms />
                </Modal>
            </div>
        </div>
    )
}