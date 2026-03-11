"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Calculator, Boxes } from "lucide-react";

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const projectId = params.id as string;

    const currentTab = pathname.includes("/canvas")
        ? "canvas"
        : pathname.includes("/calculations")
            ? "calculations"
            : pathname.includes("/node-builder")
                ? "node-builder"
                : "canvas";

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
            {/* Project Tab Bar */}
            <div className="flex items-center px-4 py-1 border-b border-border bg-background/80 backdrop-blur-sm">
                <Tabs value={currentTab}>
                    <TabsList className="h-9 bg-transparent gap-1 p-0">
                        <Link href={`/project/${projectId}/canvas`}>
                            <TabsTrigger
                                value="canvas"
                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1.5 text-xs"
                            >
                                <Network className="w-3.5 h-3.5" />
                                Process Canvas
                            </TabsTrigger>
                        </Link>
                        <Link href={`/project/${projectId}/calculations`}>
                            <TabsTrigger
                                value="calculations"
                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1.5 text-xs"
                            >
                                <Calculator className="w-3.5 h-3.5" />
                                Calculations
                            </TabsTrigger>
                        </Link>
                        <Link href={`/project/${projectId}/node-builder`}>
                            <TabsTrigger
                                value="node-builder"
                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1.5 text-xs"
                            >
                                <Boxes className="w-3.5 h-3.5" />
                                Node Builder
                            </TabsTrigger>
                        </Link>
                    </TabsList>
                </Tabs>
            </div>

            {/* Page Content */}
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    );
}
