"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTemplates, ProcessTemplate } from "@/lib/templates";
import { db } from "@/lib/instantdb";
import { id, tx } from "@instantdb/react";
import { Button } from "@/components/ui/button";
import {
    Flame,
    Cog,
    FlaskConical,
    Boxes,
    Box,
    ArrowRight,
    Loader2,
    Sparkles,
} from "lucide-react";

const iconMap: Record<string, any> = {
    Flame,
    Cog,
    FlaskConical,
    Boxes,
    Box,
};

const difficultyColors: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-500 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function TemplatesPage() {
    const templates = getTemplates();
    const router = useRouter();
    const { user } = db.useAuth();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Get user's workspace
    const { data: wsData } = db.useQuery({ workspaces: {} });
    const workspace = wsData?.workspaces?.find(
        (w: any) => w.ownerId === user?.id
    );

    const handleUseTemplate = async (template: ProcessTemplate) => {
        if (!workspace) return;
        setLoadingId(template.id);

        try {
            // 1. Create a new project
            const projectId = id();
            await db.transact(
                tx.projects[projectId].update({
                    name: template.name,
                    description: template.description,
                    status: "draft",
                    createdAt: Date.now(),
                    workspaceId: workspace.id,
                })
            );

            // 2. Create nodes with stable IDs
            const localToDbId = new Map<string, string>();
            const nodeTxns: any[] = [];

            for (const tNode of template.nodes) {
                const nodeId = id();
                localToDbId.set(tNode.localId, nodeId);
                nodeTxns.push(
                    tx.nodes[nodeId].update({
                        projectId,
                        type: tNode.type,
                        label: tNode.label,
                        positionX: tNode.positionX,
                        positionY: tNode.positionY,
                        parameters: tNode.parameters,
                        inputs: {},
                        outputs: {},
                        equations: [],
                    })
                );
            }

            // 3. Create edges (map local IDs to DB IDs)
            const edgeTxns: any[] = [];
            for (const tEdge of template.edges) {
                const sourceId = localToDbId.get(tEdge.sourceLocalId);
                const targetId = localToDbId.get(tEdge.targetLocalId);
                if (!sourceId || !targetId) continue;

                const edgeId = id();
                edgeTxns.push(
                    tx.edges[edgeId].update({
                        projectId,
                        source: sourceId,
                        target: targetId,
                        sourceHandle: tEdge.sourceHandle || "",
                        targetHandle: tEdge.targetHandle || "",
                    })
                );
            }

            await db.transact([...nodeTxns, ...edgeTxns]);

            // 4. Navigate to the new project canvas
            router.push(`/project/${projectId}/canvas`);
        } catch (err) {
            console.error("Failed to apply template:", err);
            setLoadingId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Template Library
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Pre-built process designs to jumpstart your projects
                        </p>
                    </div>
                </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => {
                    const Icon = iconMap[template.icon] || Box;
                    const isLoading = loadingId === template.id;

                    return (
                        <div
                            key={template.id}
                            className="group relative rounded-xl border border-border bg-card p-6 space-y-4 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            {template.name}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground">
                                            {template.category}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${difficultyColors[template.difficulty]}`}
                                >
                                    {template.difficulty}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {template.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                <span>
                                    {template.nodes.length} node
                                    {template.nodes.length !== 1 ? "s" : ""}
                                </span>
                                <span>·</span>
                                <span>
                                    {template.edges.length} connection
                                    {template.edges.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Node preview chips */}
                            <div className="flex flex-wrap gap-1.5">
                                {template.nodes.map((n) => (
                                    <span
                                        key={n.localId}
                                        className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground"
                                    >
                                        {n.label}
                                    </span>
                                ))}
                            </div>

                            {/* Use button */}
                            <Button
                                onClick={() => handleUseTemplate(template)}
                                disabled={isLoading || !workspace}
                                className="w-full gap-2"
                                size="sm"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating project...
                                    </>
                                ) : (
                                    <>
                                        Use Template
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
