'use client';

import { useState, useEffect } from 'react';

export default function InviteButton({ workspaceId }: { workspaceId: string }) {
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/invite?workspace=${workspaceId}`);
  }, [workspaceId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
    >
      {copied ? '링크 복사됨!' : '초대 링크 복사'}
    </button>
  );
}
