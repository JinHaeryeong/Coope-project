import { useRef } from 'react';
// 블로그에 훅으로 만드신 분이 계셔서 참고
function useMoveScroll() {
    const element = useRef<HTMLDivElement>(null);
    const onMoveToElement = () => {
        element.current?.scrollIntoView({behavior: 'smooth'});
    };
    return { element, onMoveToElement };
}

export default useMoveScroll;