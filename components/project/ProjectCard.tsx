"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Clock } from "lucide-react";

interface ProjectCardProps {
    id: string;
    name: string;
    description?: string;
    status: string;
    createdAt: number;
}

export function ProjectCard({
    id: projectId,
    name,
    description,
    status,
    createdAt,
}: ProjectCardProps) {
    const statusColor: Record<string, string> = {
        draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        approved: "bg-green-500/10 text-green-500 border-green-500/20",
    };

    const timeAgo = getTimeAgo(createdAt);

    return (
        <Link href={`/project/${projectId}/canvas`}>
            <Card className="group cursor-pointer border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <FolderKanban className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                                    {name}
                                </CardTitle>
                                {description && (
                                    <CardDescription className="text-xs mt-0.5 line-clamp-1">
                                        {description}
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                        <Badge variant="outline" className={statusColor[status] || ""}>
                            {status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo}</span>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    );
}

function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}
