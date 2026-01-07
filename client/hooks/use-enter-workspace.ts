"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export const useEnterWorkspace = () => {
    const router = useRouter();
    const { user } = useUser();
    const workspaces = useQuery(api.workspace.getMyWorkspaces);
    const createWorkspace = useMutation(api.workspace.createWorkspace);

    const onEnter = async () => {
        if (!user) return;

        // 워크스페이스 조회 (null 제외 첫 번째)
        const firstWorkspace = workspaces?.find(ws => ws !== null);

        if (firstWorkspace) {
            router.push(`/workspace/${firstWorkspace._id}/documents`);
        } else {
            // 워크스페이스가 없으면 생성 후 이동
            const id = await createWorkspace({
                name: `${user.fullName || "내 워크스페이스"}`,
            });
            router.push(`/workspace/${id}/documents`);
        }
    };

    return {
        onEnter,
        isLoading: workspaces === undefined,
        user
    };
};