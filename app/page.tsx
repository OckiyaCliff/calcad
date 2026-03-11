"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { db } from "@/lib/instantdb";

export default function Home() {
  const { isLoading, user } = db.useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isLoading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center engine-gradient">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
