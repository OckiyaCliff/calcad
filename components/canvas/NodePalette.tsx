"use client";

import { getNodesByCategory } from "@/lib/nodes/registry";
import { NodeDefinition } from "@/lib/nodes/definitions/types";
import {
    Waves,
    Cog,
    Flame,
    ArrowLeftRight,
    FlaskConical,
    GitMerge,
    Split,
    Box,
    GripVertical,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const iconMap: Record<string, any> = {
    Waves,
    Cog,
    Flame,
    ArrowLeftRight,
    FlaskConical,
    GitMerge,
    Split,
    Box,
};

interface NodePaletteProps {
    onAddNode: (type: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
    const categories = getNodesByCategory();

    const onDragStart = (e: React.DragEvent, nodeType: string) => {
        e.dataTransfer.setData("application/processlab-node", nodeType);
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <div className="w-[200px] border-r border-border bg-sidebar flex flex-col h-full">
            <div className="px-3 py-3 border-b border-border">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Node Palette
                </h3>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-4">
                    {Object.entries(categories).map(([category, nodes]) => (
                        <div key={category}>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                                {category}
                            </p>
                            <div className="space-y-1">
                                {nodes.map((def: NodeDefinition) => {
                                    const Icon = iconMap[def.icon] || Box;
                                    return (
                                        <button
                                            key={def.type}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, def.type)}
                                            onClick={() => onAddNode(def.type)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-grab active:cursor-grabbing group"
                                        >
                                            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                                            <div
                                                className="flex items-center justify-center w-5 h-5 rounded shrink-0"
                                                style={{ backgroundColor: `${def.color}20` }}
                                            >
                                                <Icon
                                                    className="w-3 h-3"
                                                    style={{ color: def.color }}
                                                />
                                            </div>
                                            <span className="truncate">{def.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <Separator className="mt-3" />
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
