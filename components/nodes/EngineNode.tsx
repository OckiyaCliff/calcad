"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { getNodeDefinition } from "@/lib/nodes/registry";
import {
    Waves,
    Cog,
    Flame,
    ArrowLeftRight,
    FlaskConical,
    GitMerge,
    Split,
    Box,
} from "lucide-react";

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

function EngineNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as any;
    const def = getNodeDefinition(nodeData.nodeType);
    const Icon = iconMap[def?.icon || "Box"] || Box;
    const color = def?.color || "#6b7280";

    const outputs = nodeData.computedOutputs || {};

    return (
        <div
            className={`
        relative min-w-[180px] rounded-xl border-2 bg-card/95 backdrop-blur-sm shadow-lg
        transition-all duration-200
        ${selected ? "border-primary shadow-primary/20 shadow-xl scale-[1.02]" : "border-border/60 hover:border-border"}
      `}
        >
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2 rounded-t-[10px]"
                style={{ backgroundColor: `${color}15` }}
            >
                <div
                    className="flex items-center justify-center w-6 h-6 rounded-md"
                    style={{ backgroundColor: `${color}25` }}
                >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-xs font-semibold text-foreground truncate">
                    {nodeData.label || def?.label || "Node"}
                </span>
            </div>

            {/* Parameters */}
            <div className="px-3 py-2 space-y-1">
                {def?.parameters.map((param) => {
                    const value = nodeData.parameters?.[param.name]?.value ?? param.defaultValue;
                    return (
                        <div
                            key={param.name}
                            className="flex items-center justify-between text-[10px]"
                        >
                            <span className="text-muted-foreground">{param.label}</span>
                            <span className="font-mono text-foreground">
                                {typeof value === "number" ? value.toFixed(2) : value}
                                {param.unit && (
                                    <span className="text-muted-foreground ml-0.5">
                                        {param.unit}
                                    </span>
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Outputs */}
            {Object.keys(outputs).length > 0 && (
                <div className="px-3 py-2 border-t border-border/30 space-y-1">
                    {Object.entries(outputs).map(([key, val]) => {
                        const outDef = def?.outputs.find((o) => o.name === key);
                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between text-[10px]"
                            >
                                <span className="text-muted-foreground">
                                    {outDef?.label || key}
                                </span>
                                <span className="font-mono font-semibold" style={{ color }}>
                                    {typeof val === "number" ? (val as number).toFixed(2) : String(val)}
                                    {outDef?.unit && (
                                        <span className="text-muted-foreground ml-0.5">
                                            {outDef.unit}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Input Handles */}
            {def?.inputs.map((input, i) => (
                <Handle
                    key={`input-${input.name}`}
                    type="target"
                    position={Position.Left}
                    id={input.name}
                    style={{
                        top: `${30 + i * 20}%`,
                        background: color,
                        width: 10,
                        height: 10,
                        border: "2px solid var(--background)",
                    }}
                />
            ))}

            {/* Output Handles */}
            {def?.outputs.map((output, i) => (
                <Handle
                    key={`output-${output.name}`}
                    type="source"
                    position={Position.Right}
                    id={output.name}
                    style={{
                        top: `${30 + i * 20}%`,
                        background: color,
                        width: 10,
                        height: 10,
                        border: "2px solid var(--background)",
                    }}
                />
            ))}
        </div>
    );
}

export const EngineNode = memo(EngineNodeComponent);
