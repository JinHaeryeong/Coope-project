"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Modal from "./modal";
import Policy from "./policy";
import Terms from "./term";

export const Footer = () => {
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

    const openTermsModal = () => setIsTermsModalOpen(true);
    const closeTermsModal = () => setIsTermsModalOpen(false);
    const openPrivacyModal = () => setIsPrivacyModalOpen(true);
    const closePrivacyModal = () => setIsPrivacyModalOpen(false);

    return (
        <div className="flex items-center w-full p-3 bottom-0 fixed bg-background z-50 dark:bg-[#1F1F1F] rounded-t-2xl">
            <div className="md:ml-auto w-full justify-between
            md:justify-end flex items-center gap-x-2
            text-muted-foreground">
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