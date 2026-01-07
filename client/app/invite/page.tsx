'use client';

import { Suspense } from 'react'; // Suspense 임포트
import { useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';

// 기존 로직을 별도 컴포넌트로 분리
function InviteContent() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const params = useSearchParams();
  const router = useRouter();
  const joinWorkspace = useMutation(api.workspace.joinWorkspace);
  const [loading, setLoading] = useState(true);

  const workspaceId = params.get('workspace');

  useEffect(() => {
    if (!workspaceId) {
      toast.error('워크스페이스 ID가 없습니다.');
      setLoading(false);
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.push(`/sign-in?redirect_url=/invite?workspace=${workspaceId}`);
      return;
    }

    if (!isLoading && isAuthenticated && workspaceId) {
      const join = async () => {
        try {
          const result = await joinWorkspace({ workspaceId });
          if (result === 'already_member') {
            toast.info('이미 워크스페이스에 참여되어 있어요!');
          } else if (result === 'joined') {
            toast.success('워크스페이스에 참여했어요!');
          }
          router.push(`/workspace/${workspaceId}/documents`);
        } catch (err: unknown) {
          console.error('초대 실패:', err);
          if (err instanceof Error) {
            toast.error(err.message || '워크스페이스 참여 중 오류가 발생했어요.');
          }
        } finally {
          setLoading(false);
        }
      };
      join();
    }
  }, [isLoading, isAuthenticated, workspaceId, joinWorkspace, router]);

  return (
    <div className="h-full flex items-center justify-center">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-muted-foreground">워크스페이스에 참여 중...</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">처리가 완료되었습니다.</p>
      )}
    </div>
  );
}

// 최종 export 하는 부분에서 Suspense로 감싸기
export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}