import Image from "next/image";




export const Logo = () => {
    return (
        <div className="md:flex items-center gap-x-2">
            {/*라이트 모드 로고: 
                1. webp로 변경하여 용량 절감
                2. priority를 주어 로고가 엑박 없이 즉시 뜨게 함
            */}
            <Image
                src="/logo.webp"
                height="200"
                width="200"
                alt="logo"
                priority
                className="dark:hidden"
            />
            <Image
                src="/logo-dark.webp"
                height="200"
                width="200"
                alt="logo"
                className="hidden dark:block"
            />
        </div>
    )
}