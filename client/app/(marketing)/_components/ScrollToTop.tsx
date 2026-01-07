import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

//스크롤을 맨 위로 올려줌
export const ScrollToTop = () => {
    const [showButton, setShowButton] = useState(false);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    useEffect(() => {
        const ShowButtonClick = () => {
            if (window.scrollY > 100) {
                setShowButton(true);
            } else {
                setShowButton(false);
            }
        }
        window.addEventListener("scroll", ShowButtonClick)
        return () => {
            window.removeEventListener("scroll", ShowButtonClick)
        }
    }, [])
    return (
        <>
            {showButton &&
                <Button type="button" className="fixed bottom-20 z-99 right-10 rounded-full" onClick={scrollToTop}><ArrowUp /></Button>
            }
        </>
    );
}

export default ScrollToTop;