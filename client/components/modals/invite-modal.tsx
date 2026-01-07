'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInvite } from '@/hooks/use-invite';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  workspaceId: string;
}

export default function InviteModal({ workspaceId }: Props) {
  const { isOpen, onClose } = useInvite();
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/invite?workspace=${workspaceId}`);
  }, [workspaceId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="border-b pb-3">
          <DialogTitle>워크스페이스에 초대하기</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            <Label>Invite link</Label>
            <span className="text-[0.8rem] text-muted-foreground">
              공유 가능한 링크를 복사하여 동료에게 전송하세요.
            </span>
          </div>
          <Button size="sm" onClick={handleCopy}>
            복사하기
          </Button>
        </div>

        <div className="text-sm p-3 bg-muted rounded font-mono break-all">
          {inviteUrl}
        </div>
      </DialogContent>
    </Dialog>
  );
}
