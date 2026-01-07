"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { SignInButton } from "@clerk/clerk-react";
import { Logo } from "./logo";

export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user } = useUser();
  const workspaces = useQuery(api.workspace.getMyWorkspaces);
  const createWorkspace = useMutation(api.workspace.createWorkspace);
  const router = useRouter();


  // 비즈니스 로직을 별도 핸들러로 깔끔하게 정리
  const onEnter = async () => {
    if (!user) return;

    // Optional Chaining과 기본값 처리로 가독성 향상
    const firstWorkspace = workspaces?.find(ws => ws !== null);

    if (firstWorkspace) {
      router.push(`/workspace/${firstWorkspace._id}/documents`);
    } else {
      const id = await createWorkspace({
        name: `${user.fullName || "내 워크스페이스"}`,
      });
      router.push(`/workspace/${id}/documents`);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h3 className="text-base sm:text-xl md:text-2xl font-medium">
        협업을 새롭게 정의하다
      </h3>
      <div className="sm:w-full w-full"><Logo /></div>
      {isLoading && (
        <div className="w-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}
      {isAuthenticated && !isLoading && (
        <Button onClick={onEnter}>
          시작하기
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
      {!isAuthenticated && !isLoading && (
        <SignInButton mode="modal">
          <Button>
            Get Coope free
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </SignInButton>
      )}
    </div>
  );
};
