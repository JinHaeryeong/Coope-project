import { Footer } from "./_components/footer";
import { Navbar } from "./_components/navbar";

const MarketingLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="h-full dark:bg-[#1F1F1F] flex flex-col">
            <Navbar />
            <main className="box-border">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default MarketingLayout;