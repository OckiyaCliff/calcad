"use client";

import { useParams } from "next/navigation";
import { db } from "@/lib/instantdb";
import { getNodeDefinition } from "@/lib/nodes/registry";
import { ExportButton } from "@/components/project/ExportButton";
import { Calculator, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CalculationsPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [filter, setFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const { data, isLoading } = db.useQuery({
        nodes: { $: { where: { projectId } } },
    });

    const savedNodes = data?.nodes || [];

    // Enrich with definitions
    const enrichedNodes = savedNodes.map((n: any) => {
        const def = getNodeDefinition(n.type);
        return {
            id: n.id,
            name: n.label || def?.label || n.type,
            type: n.type,
            category: def?.category || "Unknown",
            parameters: n.parameters || {},
            outputs: n.outputs || {},
            def,
        };
    });

    // Get unique categories
    const categories = Array.from(new Set(enrichedNodes.map((n) => n.category)));

    // Apply filters
    const filteredNodes = enrichedNodes.filter((n) => {
        const matchesSearch =
            !filter ||
            n.name.toLowerCase().includes(filter.toLowerCase()) ||
            n.type.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = !categoryFilter || n.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Prepare export data
    const exportData = {
        nodes: filteredNodes.map((n) => ({
            name: n.name,
            type: n.type,
            category: n.category,
            parameters: n.parameters,
            outputs: n.outputs,
        })),
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading calculations...</p>
                </div>
            </div>
        );
    }

    if (savedNodes.length === 0) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Calculations</h1>
                <p className="text-muted-foreground text-sm mb-8">
                    View and export engineering calculations for this project.
                </p>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Calculator className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No calculations yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Add nodes to the Process Canvas first. Their parameters and
                        computed outputs will appear here as a calculation summary.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calculations</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {filteredNodes.length} node{filteredNodes.length !== 1 ? "s" : ""} · {Object.keys(exportData.nodes.reduce((acc, n) => ({ ...acc, ...n.outputs }), {})).length} computed outputs
                    </p>
                </div>
                <ExportButton data={exportData} />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search nodes..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-10 h-9"
                    />
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!categoryFilter
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === cat
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Node cards */}
            <div className="space-y-4">
                {filteredNodes.map((node) => (
                    <div
                        key={node.id}
                        className="rounded-xl border border-border bg-card p-5 space-y-4"
                    >
                        {/* Node header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                    style={{
                                        backgroundColor: `${node.def?.color || "#6b7280"}15`,
                                        color: node.def?.color || "#6b7280",
                                    }}
                                >
                                    <Calculator className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">{node.name}</h3>
                                    <p className="text-[10px] text-muted-foreground">
                                        {node.category} · {node.type}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Parameters & Outputs in table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Parameters */}
                            {Object.keys(node.parameters).length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Parameters
                                    </p>
                                    <div className="space-y-1">
                                        {Object.entries(node.parameters).map(([key, param]: [string, any]) => {
                                            const paramDef = node.def?.parameters.find(
                                                (p: any) => p.name === key
                                            );
                                            return (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/30 text-xs"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {paramDef?.label || key}
                                                    </span>
                                                    <span className="font-mono">
                                                        {typeof param?.value === "number"
                                                            ? param.value.toFixed(2)
                                                            : "—"}
                                                        {param?.unit && (
                                                            <span className="text-muted-foreground ml-1">
                                                                {param.unit}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Outputs */}
                            {Object.keys(node.outputs).length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Computed Outputs
                                    </p>
                                    <div className="space-y-1">
                                        {Object.entries(node.outputs).map(([key, val]) => {
                                            const outDef = node.def?.outputs.find(
                                                (o: any) => o.name === key
                                            );
                                            return (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between px-3 py-1.5 rounded-md bg-primary/5 border border-primary/10 text-xs"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {outDef?.label || key}
                                                    </span>
                                                    <span className="font-mono font-semibold text-primary">
                                                        {typeof val === "number"
                                                            ? (val as number).toFixed(4)
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
                            )}
                        </div>

                        {/* Equations */}
                        {node.def?.equations && node.def.equations.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Equations
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {node.def.equations.map((eq: string, i: number) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-md bg-muted/50 text-[10px] font-mono text-muted-foreground"
                                        >
                                            {eq}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
