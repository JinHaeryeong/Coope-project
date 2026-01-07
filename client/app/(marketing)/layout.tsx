import { Footer } from "./_components/footer";
import { Navbar } from "./_components/navbar";

const MarketingLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="min-h-screen dark:bg-[#1F1F1F] flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default MarketingLayout;