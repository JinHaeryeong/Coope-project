import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import Link from "next/link";


//자주 묻는 질문 내용
const FaqContent = () => {
    const { user } = useUser();
    const userRole = user?.publicMetadata?.role
    return (
        <div className="w-50 h-80">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>가입하지 않고 페이지 편집에 참여할 수 있나요?</AccordionTrigger>
                    <AccordionContent>
                        Coope의 아이디가 없는 경우 불가능합니다. 읽기 전용으로만 공유를 허용하고있습니다
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>페이지를 완전히 삭제했을 때 복구할 수 있나요?</AccordionTrigger>
                    <AccordionContent>
                        페이지를 삭제하실 경우 휴지통에 임시 보관됩니다. 하지만, 휴지통에서도 페이지를 삭제하셨다면 복구할 수 있는 방법은 없습니다.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>휴지통 전체 삭제 기능을 제공하나요?</AccordionTrigger>
                    <AccordionContent>
                        안타깝게도, 휴지통 전체를 삭제하는 기능은 아직 제공하지 않습니다. 꾸준한 업데이트로 추가할 수 있도록 노력하겠습니다.
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
            <div className="div-faq-cs">
                <span className="pr-1 font-medium">해결되지 않은 의문이 남아있으신가요?</span>
                {userRole !== 'admin' ? <Link href="/customerService"><Button>1:1 문의</Button></Link> :
                    <Link href="/csAdmin"><Button>1:1 문의</Button></Link>}
            </div>
        </div>
    );
}

export default FaqContent;