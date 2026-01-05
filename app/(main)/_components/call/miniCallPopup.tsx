// MiniCallPopup.tsx
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import Image from "next/image";

export default function MiniCallPopup({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg flex gap-2 z-50">
      {/* 최소화된 UI: 아이콘들 + 복구 버튼 */}
      <Button title="마이크"><Image src="/mic.png" alt="mic" /></Button>
      <Button title="카메라"><Image src="/cam.png" alt="cam" /></Button>
      <Button title="화면공유"></Button>
      <Button title="확장" onClick={onExpand}><Expand /></Button>
    </div>
  );
}
