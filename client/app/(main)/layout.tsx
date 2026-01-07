'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useConvexAuth } from 'convex/react';

import { Spinner } from '@/components/spinner';
import { Navigation } from './_components/navigation';
import { SearchCommand } from '@/components/search-command';
import { Button } from '@/components/ui/button';
import { Ghost } from 'lucide-react';
import { Toaster } from 'sonner';
import { AIChatModal } from '@/components/ai-chat-modal';
import { ChatProvider } from '@/components/chat-context';
import { EdgeStoreProvider } from '@/lib/edgestore';
import { ModalProvider } from '@/components/providers/modal-provider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 로그인 안 되어 있으면 / 로 리디렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // 로딩 중이거나 인증 안됐으면 스피너
  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <EdgeStoreProvider>
      <ModalProvider />
      <ChatProvider>
        <div className="h-full flex dark:bg-[#1F1F1F]">
          {/* 채팅 버튼 */}
          {!pathname.includes("/friends") && (
            <Button
              type="button"
              className="fixed bottom-10 right-10 z-[9999] rounded-full"
              onClick={() => setIsChatOpen(true)}
            >
              <Ghost />
            </Button>
          )}
          <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

          {/* 사이드바 */}
          <Navigation />

          {/* 콘텐츠 영역 */}
          <main className="flex-1 h-full overflow-y-auto">
            <SearchCommand />
            {children}
          </main>

          {/* 토스트 알림 */}
          <Toaster />
        </div>
      </ChatProvider>
    </EdgeStoreProvider>

  );
}
