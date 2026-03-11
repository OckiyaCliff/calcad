"use client";

import { db } from "@/lib/instantdb";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { isLoading, user, error } = db.useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center engine-gradient">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center engine-gradient">
                <div className="text-center">
                    <p className="text-destructive text-sm">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <AppShell>{children}</AppShell>;
}
