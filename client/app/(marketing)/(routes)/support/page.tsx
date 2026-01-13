"use client"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Modal from "@/app/(marketing)/_components/modal";
import { useState } from "react"
import { BookOpenText, MailOpen } from "lucide-react";
import FaqContent from "@/app/(marketing)/_components/faq";
import { useRouter } from "next/navigation";


const Support = () => {
  const router = useRouter();
  const [isQnaModalOpen, setIsQnaModalOpen] = useState(false);

  const openQnaModal = () => setIsQnaModalOpen(true);
  const closeQnasModal = () => setIsQnaModalOpen(false);
  const redirectFunctionPage = () => {
    router.push('/function');
  }

  return (
    <div className="min-h-full flex flex-col relative box-border pt-10">
      <div className="flex flex-col items-center justify-center md:justify-start text-center gap-y-8 flex-1 px-6 pb-10">
        <header className="space-y-4 text-center box-border max-w-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
            고객지원
          </h1>
          <p className="text-base md:text-xl text-muted-foreground break-keep">
            Coope의 기능들을 함께 알아보고, 의문을 해결하세요
          </p>
        </header>
        <div className="tracking-in-expand">
          <Button onClick={redirectFunctionPage}>
            <BookOpenText /> Coope의 기능
          </Button>
          <Button onClick={openQnaModal} className="mx-2">
            <MailOpen /> 자주 묻는 질문
          </Button>
          <div className="flex items-center">
            <div className="relative w-[350px] h-[350px] md:w-[600px] md:h-[600px]">
              {/* 이미지 dark 모드일때거 필요함 */}
              <Image
                src="/support1.webp"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 350px, 600px"
                alt="자주묻는질문"
              />
            </div>
          </div>
        </div>
      </div>
      {isQnaModalOpen && (
        <Modal isOpen={isQnaModalOpen} onClose={closeQnasModal} title="자주 묻는 질문">
          <FaqContent />
        </Modal>
      )}
    </div>
  );
}

export default Support;
