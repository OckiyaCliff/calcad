"use client";

import { getNodeDefinition } from "@/lib/nodes/registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertiesPanelProps {
    selectedNode: any;
    onUpdateParameter: (nodeId: string, paramName: string, value: number) => void;
    onDeleteNode: (nodeId: string) => void;
    onClose: () => void;
}

export function PropertiesPanel({
    selectedNode,
    onUpdateParameter,
    onDeleteNode,
    onClose,
}: PropertiesPanelProps) {
    if (!selectedNode) return null;

    const def = getNodeDefinition(selectedNode.data.nodeType);
    if (!def) return null;

    const outputs = selectedNode.data.computedOutputs || {};

    return (
        <div className="w-[280px] border-l border-border bg-sidebar flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">
                        {selectedNode.data.label || def.label}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {def.category} · {def.type}
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="w-3.5 h-3.5" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    {/* Parameters Section */}
                    {def.parameters.length > 0 && (
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Parameters
                            </p>
                            <div className="space-y-3">
                                {def.parameters.map((param) => {
                                    const currentValue =
                                        selectedNode.data.parameters?.[param.name]?.value ??
                                        param.defaultValue;
                                    return (
                                        <div key={param.name} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs">{param.label}</Label>
                                                {param.unit && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {param.unit}
                                                    </span>
                                                )}
                                            </div>
                                            <Input
                                                type="number"
                                                value={currentValue}
                                                step="any"
                                                min={param.min}
                                                max={param.max}
                                                onChange={(e) =>
                                                    onUpdateParameter(
                                                        selectedNode.id,
                                                        param.name,
                                                        parseFloat(e.target.value) || 0
                                                    )
                                                }
                                                className="h-8 text-sm font-mono"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Equations Section */}
                    {def.equations.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Equations
                                </p>
                                <div className="space-y-1.5">
                                    {def.equations.map((eq, i) => (
                                        <div
                                            key={i}
                                            className="px-2.5 py-1.5 rounded-md bg-muted/50 text-[11px] font-mono text-muted-foreground"
                                        >
                                            {eq}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Outputs Section */}
                    {Object.keys(outputs).length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Outputs
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(outputs).map(([key, val]) => {
                                        const outDef = def.outputs.find((o) => o.name === key);
                                        return (
                                            <div
                                                key={key}
                                                className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/10"
                                            >
                                                <span className="text-xs text-muted-foreground">
                                                    {outDef?.label || key}
                                                </span>
                                                <span className="text-xs font-mono font-semibold text-primary">
                                                    {typeof val === "number"
                                                        ? (val as number).toFixed(3)
                                                        : String(val)}
                                                    {outDef?.unit && (
                                                        <span className="text-muted-foreground ml-1 font-normal">
                                                            {outDef.unit}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Inputs Section */}
                    {def.inputs.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Inputs (from connections)
                                </p>
                                <div className="space-y-2">
                                    {def.inputs.map((inp) => {
                                        const val = selectedNode.data.inputs?.[inp.name];
                                        return (
                                            <div
                                                key={inp.name}
                                                className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/30"
                                            >
                                                <span className="text-xs text-muted-foreground">
                                                    {inp.label}
                                                </span>
                                                <span className="text-xs font-mono">
                                                    {val !== undefined ? (typeof val === 'number' ? val.toFixed(3) : val) : "—"}
                                                    {inp.unit && (
                                                        <span className="text-muted-foreground ml-1">
                                                            {inp.unit}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* Delete Button */}
            <div className="p-3 border-t border-border">
                <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => onDeleteNode(selectedNode.id)}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Node
                </Button>
            </div>
        </div>
    );
}
