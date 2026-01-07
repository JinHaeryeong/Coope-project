"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

function DocumentsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;

  const { user } = useUser();
  const router = useRouter();
  const create = useMutation(api.documents.create);

  if (!workspaceId) {
    console.log("waiting for hydration...");
    return null;
  }

  const onCreate = async () => {
    try {
      const promise = create({
        title: "Untitled",
        workspaceId,
      });

      toast.promise(promise, {
        loading: "새 노트 만드는중...",
        success: "새 노트가 만들어졌습니다!",
        error: "새 노트를 만드는데 실패했습니다.",
      });

      const documentId = await promise;
      router.push(`/workspace/${workspaceId}/documents/${documentId}`);
    } catch (err) {
      console.error("생성에 실패했습니다:", err);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Image
        src="/empty.png"
        height={300}
        width={300}
        alt="empty"
        className="dark:hidden"
        priority
      />
      <Image
        src="/empty-dark.png"
        height={300}
        width={300}
        alt="empty"
        className="dark:block hidden"
        priority
      />
      <h2 className="text-lg font-medium">
        {user?.username}&apos;의 Coope에 온 걸 환영합니다!
      </h2>
      <Button onClick={onCreate}>
        <PlusCircle className="w-4 h-4 mr-2" />
        새 노트 생성
      </Button>
    </div>
  );
}

export default DocumentsPage;
