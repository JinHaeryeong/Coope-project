import { Toaster } from "sonner";
import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { preconnect, preload } from "react-dom";

export const metadata: Metadata = {
  title: "coope",
  description: "The connected workspace where better, faster work happens",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/logo.webp",
        href: "/logo.webp",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/logo-dark.webp",
        href: "/logo-dark.webp",
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  preconnect("https://cdn.jsdelivr.net", { crossOrigin: "anonymous" });
  preconnect("https://renewed-pipefish-31.clerk.accounts.dev", { crossOrigin: "anonymous" });
  preload(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
    { as: "style", crossOrigin: "anonymous" }
  );
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans">
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="coope-theme-2"
          >
            <Toaster position="bottom-center" />
            {children}
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}