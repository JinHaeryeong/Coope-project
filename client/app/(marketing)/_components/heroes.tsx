import Image from "next/image";

export const Heroes = () => {
    return (
        <div className="flext flex-col items-center justify-center
        max-w-5xl">
            <div className="flex items-center">
                <div className="relative w-[300px] h-[300px] sm:w-[350px]
                sm:h-[350px] md:h-[400px] md:w-[400px]">
                    <Image
                        src="/documents.webp"
                        fill
                        priority
                        unoptimized
                        sizes="(max-width: 640px) 300px, (max-width: 768px) 350px, 400px"
                        className="object-contain dark:hidden"
                        alt="Documents"
                        quality={75}
                    />
                    <Image
                        src="/documents-dark.webp"
                        fill
                        unoptimized
                        className="object-contain hidden dark:block"
                        sizes="(max-width: 640px) 300px, (max-width: 768px) 350px, 400px"
                        alt="Documents"
                    />
                </div>
                <div className="relative h-[400px] w-[400px] hidden
                md:block">
                    <Image
                        src="/reading.webp"
                        fill
                        priority
                        unoptimized
                        sizes="(max-width: 640px) 300px, (max-width: 768px) 350px, 400px"
                        className="object-contain dark:hidden"
                        alt="Reading"
                    />
                    <Image
                        src="/reading-dark.webp"
                        fill
                        unoptimized
                        className="object-contain hidden dark:block"
                        sizes="(max-width: 640px) 300px, (max-width: 768px) 350px, 400px"
                        alt="Reading"
                    />
                </div>
            </div>
        </div>

    )
}