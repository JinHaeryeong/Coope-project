"use client";

import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { useEnterWorkspace } from "@/hooks/use-enter-workspace";
import { Logo } from "./logo";

export const Heading = () => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const { onEnter, isLoading: workspaceLoading } = useEnterWorkspace();

  // 인증 정보나 워크스페이스 목록을 불러오는 중일 때 통합 로딩 상태
  const isLoading = authLoading || workspaceLoading;

  return (
    <div className="max-w-3xl space-y-4 min-h-44">
      <h3 className="text-base sm:text-xl md:text-2xl font-medium">
        협업을 새롭게 정의하다
      </h3>

      <div className="sm:w-full w-full">
        <Logo />
      </div>
      <div className="h-12 w-full flex items-center justify-center">
        {isLoading ? (
          <Spinner size="lg" />
        ) : (
          <>
            {isAuthenticated ? (
              <Button onClick={onEnter} size="lg">
                시작하기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button size="lg">
                  시작하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </SignInButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};