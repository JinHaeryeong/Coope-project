"use client"
import Image from "next/image";
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

import useMoveScroll from '@/hooks/useMoveScroll';
import { Button } from '@/components/ui/button';
import ScrollToTop from '@/app/(marketing)/_components/ScrollToTop';
const functionPage = () => {
    const functionTabs = Array.from({ length: 5 }, () => useMoveScroll()); //클릭시 그 기능이 위치한 곳으로 스크롤을 이동시키기 위한 배열
    const functions =
        [{ id: 1, name: "기능1" },
        { id: 2, name: "기능2" },
        { id: 3, name: "기능3" },
        { id: 4, name: "기능4" },
        { id: 5, name: "기능5" },
        ];
    return (
        <div className="min-h-full flex flex-col mb-20">
            <div className="flex flex-col items-center justify-center
              md:justify-start text-center gap-y-8 flex-1 px-6 pb-10">
                <ScrollToTop />
                <h1 className="text-4xl font-bold">기능</h1>
                <div className='tracking-in-expand'>
                    <h2 className='font-semibold'>Coope의 다양한 기능들을 소개합니다! 기능을 알아보고 함께 만들러가요!</h2>
                    <div>
                        <Image
                            src="/functionPeople.png"
                            width={1000}
                            height={400}
                            className="object-contain"
                            alt="Documents"
                        />
                        <h6 className="text-right text-blue-500 pb-10 text-sm">Designed by Freepik</h6>
                    </div>
                    <div className="div-container">
                        {functions.map((func, index) => {
                            return (
                                /*<div key={func.id} className='div-box rounded-lg cursor-pointer' onClick={functionTabs[index].onMoveToElement}>
                                    <h2 className='top-1/2 relative'>{func.name}</h2>
                                </div>*/
                                <Button key={func.id} className='w-11/12 h-40' onClick={functionTabs[index].onMoveToElement}>
                                    {func.name}
                                </Button>
                            )
                        })}
                    </div>
                    <div ref={functionTabs[0].element}>
                        <h1 className="text-3xl font-bold">기능1</h1>
                        <Image
                            src="/functionPeople.png"
                            width={1000}
                            height={400}
                            className="object-contain"
                            alt="Documents"
                        />
                    </div>
                    <div ref={functionTabs[1].element}>
                        <h1 className="text-3xl font-bold">기능2</h1>
                        <Image
                            src="/functionPeople.png"
                            width={1000}
                            height={400}
                            className="object-contain"
                            alt="Documents"
                        />
                    </div>
                    <div ref={functionTabs[2].element}>
                        <h1 className="text-3xl font-bold">기능3</h1>
                        <Image
                            src="/functionPeople.png"
                            width={1000}
                            height={400}
                            className="object-contain"
                            alt="Documents"
                        />
                    </div>
                    <div ref={functionTabs[3].element}>
                        <h1 className="text-3xl font-bold">기능4</h1>
                        <Image
                            src="/functionPeople.png"
                            width={1000}
                            height={400}
                            className="object-contain"
                            alt="Documents"
                        />
                    </div>
                    <div ref={functionTabs[4].element}>
                        <h1 className="text-3xl font-bold">기능5</h1>
                        <Image
                            src="/functionPeople.png"
                            width={1000}
                            height={400}
                            className="object-contain"
                            alt="Documents"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default functionPage;

/*

//Swiper을 사용할지 그냥 사진을 사용할지 모르겠으니 우선 빼둠
<Swiper
                        effect={'coverflow'}
                        grabCursor={true}
                        centeredSlides={true}
                        autoplay={{
                            delay: 2000
                        }}
                        slidesPerView={'auto'}
                        coverflowEffect={{
                            rotate: 50,
                            stretch: 0,
                            depth: 100,
                            modifier: 1,
                            slideShadows: true,
                        }}
                        pagination={true}
                        modules={[Autoplay, EffectCoverflow, Pagination]}
                        className="mySwiper w-5/12"
                    >
                        <SwiperSlide onClick={functionTabs[0].onMoveToElement}>
                            <h3>기능1</h3>
                            <img src="https://swiperjs.com/demos/images/nature-1.jpg" className="rounded-lg" />
                        </SwiperSlide>
                        <SwiperSlide onClick={functionTabs[1].onMoveToElement}>
                            <h3>기능2</h3>
                            <img src="https://swiperjs.com/demos/images/nature-2.jpg" className="rounded-lg" />
                        </SwiperSlide>
                        <SwiperSlide onClick={functionTabs[2].onMoveToElement}>
                            <h3>기능3
                            </h3>
                            <img src="https://swiperjs.com/demos/images/nature-3.jpg" className="rounded-lg" />
                        </SwiperSlide>
                        <SwiperSlide onClick={functionTabs[3].onMoveToElement}>
                            <h3>기능4</h3>
                            <img src="https://swiperjs.com/demos/images/nature-4.jpg" className="rounded-lg" />
                        </SwiperSlide>
                        <SwiperSlide onClick={functionTabs[4].onMoveToElement}>
                            <h3>기능5</h3>
                            <img src="https://swiperjs.com/demos/images/nature-5.jpg" className="rounded-lg" />
                        </SwiperSlide>
                    </Swiper>


*/