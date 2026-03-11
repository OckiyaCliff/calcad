"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FolderKanban,
    Settings,
    FlaskConical,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Projects",
        href: "/dashboard",
        icon: FolderKanban,
    },
    {
        label: "Templates",
        href: "/dashboard",
        icon: FlaskConical,
    },
    {
        label: "Settings",
        href: "/dashboard",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "relative flex flex-col h-screen border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
                collapsed ? "w-[68px]" : "w-[240px]"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <FlaskConical className="w-4 h-4 text-primary" />
                </div>
                {!collapsed && (
                    <span className="font-semibold text-sm tracking-tight text-foreground">
                        ProcessLab
                    </span>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-3">
                <nav className="flex flex-col gap-1 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const linkContent = (
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={item.label}>
                                    <TooltipTrigger render={linkContent} />
                                    <TooltipContent side="right">{item.label}</TooltipContent>
                                </Tooltip>
                            );
                        }

                        return <div key={item.label}>{linkContent}</div>;
                    })}
                </nav>
            </ScrollArea>

            <Separator />

            {/* Collapse toggle */}
            <div className="p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </aside>
    );
}
