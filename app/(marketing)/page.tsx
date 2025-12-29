
import dynamic from "next/dynamic";


const DynamicHeading = dynamic(() => import("./_components/heading").then(m => m.Heading), {
  loading: () => <div className="h-40 w-full animate-pulse bg-slate-100 rounded-lg" />
});

const DynamicHeroes = dynamic(() => import("./_components/heroes").then(m => m.Heroes), {
  ssr: true,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center">
    <div className="animate-pulse bg-slate-200 h-full w-full rounded-lg" />
  </div>
});

const MarketingPage = () => {

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex flex-col items-center justify-center
      md:justify-start text-center gap-y-8 flex-1 px-6 pb-10 pt-20">
        <DynamicHeading />
        <DynamicHeroes />
        <div className="ocean">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      </div>
    </div>
  );
}

export default MarketingPage;