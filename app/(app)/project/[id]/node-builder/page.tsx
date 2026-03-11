"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Eye, Boxes, ArrowRight } from "lucide-react";
import { registerCustomNode, NodeDefinition } from "@/lib/nodes/registry";
import { evaluateNodeEquations, EvalContext } from "@/lib/engine/evaluator";

interface FieldEntry {
    name: string;
    label: string;
    unit: string;
    defaultValue: number;
}

export default function NodeBuilderPage() {
    const [nodeName, setNodeName] = useState("");
    const [category, setCategory] = useState("Custom");
    const [inputs, setInputs] = useState<FieldEntry[]>([]);
    const [parameters, setParameters] = useState<FieldEntry[]>([]);
    const [equations, setEquations] = useState<string[]>([""]);
    const [outputs, setOutputs] = useState<FieldEntry[]>([]);
    const [savedMessage, setSavedMessage] = useState("");
    const [previewOutputs, setPreviewOutputs] = useState<Record<string, number>>({});

    const addField = (
        setter: React.Dispatch<React.SetStateAction<FieldEntry[]>>
    ) => {
        setter((prev) => [
            ...prev,
            { name: "", label: "", unit: "", defaultValue: 0 },
        ]);
    };

    const removeField = (
        index: number,
        setter: React.Dispatch<React.SetStateAction<FieldEntry[]>>
    ) => {
        setter((prev) => prev.filter((_, i) => i !== index));
    };

    const updateField = (
        index: number,
        field: keyof FieldEntry,
        value: string | number,
        setter: React.Dispatch<React.SetStateAction<FieldEntry[]>>
    ) => {
        setter((prev) =>
            prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
        );
    };

    const handlePreview = () => {
        const context: EvalContext = {};
        for (const inp of inputs) {
            context[inp.name] = inp.defaultValue;
        }
        for (const param of parameters) {
            context[param.name] = param.defaultValue;
        }
        const validEquations = equations.filter((e) => e.trim());
        const result = evaluateNodeEquations(validEquations, context);

        const outputValues: Record<string, number> = {};
        for (const out of outputs) {
            if (result[out.name] !== undefined) {
                outputValues[out.name] = result[out.name];
            }
        }
        setPreviewOutputs(outputValues);
    };

    const handleSave = () => {
        if (!nodeName.trim()) return;

        const typeName = `custom_${nodeName.toLowerCase().replace(/\s+/g, "_")}`;
        const validEquations = equations.filter((e) => e.trim());

        const def: NodeDefinition = {
            type: typeName,
            label: nodeName,
            category: category || "Custom",
            icon: "Box",
            color: "#a855f7",
            inputs: inputs
                .filter((i) => i.name.trim())
                .map((i) => ({
                    name: i.name,
                    label: i.label || i.name,
                    unit: i.unit,
                    defaultValue: i.defaultValue,
                })),
            parameters: parameters
                .filter((p) => p.name.trim())
                .map((p) => ({
                    name: p.name,
                    label: p.label || p.name,
                    unit: p.unit,
                    defaultValue: p.defaultValue,
                })),
            equations: validEquations,
            outputs: outputs
                .filter((o) => o.name.trim())
                .map((o) => ({
                    name: o.name,
                    label: o.label || o.name,
                    unit: o.unit,
                })),
        };

        registerCustomNode(def);
        setSavedMessage(`"${nodeName}" node registered! It's now available in the canvas palette.`);
        setTimeout(() => setSavedMessage(""), 4000);
    };

    const FieldEditor = ({
        title,
        fields,
        setter,
        showDefault,
    }: {
        title: string;
        fields: FieldEntry[];
        setter: React.Dispatch<React.SetStateAction<FieldEntry[]>>;
        showDefault?: boolean;
    }) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </Label>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => addField(setter)}
                >
                    <Plus className="w-3 h-3" /> Add
                </Button>
            </div>
            {fields.map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        placeholder="Variable name"
                        value={field.name}
                        onChange={(e) => updateField(i, "name", e.target.value, setter)}
                        className="h-8 text-xs flex-1"
                    />
                    <Input
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => updateField(i, "label", e.target.value, setter)}
                        className="h-8 text-xs flex-1"
                    />
                    <Input
                        placeholder="Unit"
                        value={field.unit}
                        onChange={(e) => updateField(i, "unit", e.target.value, setter)}
                        className="h-8 text-xs w-20"
                    />
                    {showDefault && (
                        <Input
                            type="number"
                            placeholder="Default"
                            value={field.defaultValue}
                            onChange={(e) =>
                                updateField(i, "defaultValue", parseFloat(e.target.value) || 0, setter)
                            }
                            className="h-8 text-xs w-20"
                        />
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeField(i, setter)}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">
                    Custom Node Builder
                </h1>
                <p className="text-sm text-muted-foreground">
                    Define your own engineering calculation nodes with custom inputs,
                    parameters, equations, and outputs.
                </p>
            </div>

            {savedMessage && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {savedMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Builder Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Boxes className="w-4 h-4 text-primary" />
                                Node Definition
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Node Name</Label>
                                    <Input
                                        value={nodeName}
                                        onChange={(e) => setNodeName(e.target.value)}
                                        placeholder="e.g. Custom Reactor"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Category</Label>
                                    <Input
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Reaction"
                                        className="h-9"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <FieldEditor title="Inputs" fields={inputs} setter={setInputs} showDefault />
                            <Separator />
                            <FieldEditor title="Parameters" fields={parameters} setter={setParameters} showDefault />
                            <Separator />

                            {/* Equations */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Equations
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => setEquations((prev) => [...prev, ""])}
                                    >
                                        <Plus className="w-3 h-3" /> Add
                                    </Button>
                                </div>
                                {equations.map((eq, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input
                                            value={eq}
                                            onChange={(e) =>
                                                setEquations((prev) =>
                                                    prev.map((v, j) => (j === i ? e.target.value : v))
                                                )
                                            }
                                            placeholder="e.g. Q = flow_rate * Cp * (Tin - Tout)"
                                            className="h-8 text-xs font-mono flex-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                            onClick={() =>
                                                setEquations((prev) => prev.filter((_, j) => j !== i))
                                            }
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Separator />
                            <FieldEditor title="Outputs" fields={outputs} setter={setOutputs} />
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Panel */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Eye className="w-4 h-4 text-primary" />
                                Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Node Preview */}
                            <div className="rounded-xl border-2 border-border bg-card p-3 space-y-2">
                                <div
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                                    style={{ backgroundColor: "#a855f720" }}
                                >
                                    <Boxes className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                                    <span className="text-xs font-semibold">
                                        {nodeName || "Untitled Node"}
                                    </span>
                                </div>
                                {parameters.filter((p) => p.name).length > 0 && (
                                    <div className="space-y-1 px-1">
                                        {parameters
                                            .filter((p) => p.name)
                                            .map((p, i) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between text-[10px]"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {p.label || p.name}
                                                    </span>
                                                    <span className="font-mono">
                                                        {p.defaultValue}
                                                        {p.unit && (
                                                            <span className="text-muted-foreground ml-0.5">
                                                                {p.unit}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                {Object.keys(previewOutputs).length > 0 && (
                                    <div className="border-t border-border/30 pt-1 space-y-1 px-1">
                                        {Object.entries(previewOutputs).map(([key, val]) => {
                                            const outDef = outputs.find((o) => o.name === key);
                                            return (
                                                <div
                                                    key={key}
                                                    className="flex justify-between text-[10px]"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {outDef?.label || key}
                                                    </span>
                                                    <span className="font-mono font-semibold text-purple-400">
                                                        {val.toFixed(3)}
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
                            </div>

                            {/* Flow preview */}
                            {inputs.filter((i) => i.name).length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                        Ports
                                    </p>
                                    <div className="space-y-1">
                                        {inputs
                                            .filter((i) => i.name)
                                            .map((inp, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                                        IN
                                                    </Badge>
                                                    <span>{inp.label || inp.name}</span>
                                                    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                                                </div>
                                            ))}
                                        {outputs
                                            .filter((o) => o.name)
                                            .map((out, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary text-primary">
                                                        OUT
                                                    </Badge>
                                                    <span>{out.label || out.name}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full text-xs"
                                    onClick={handlePreview}
                                >
                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                    Test Equations
                                </Button>
                                <Button className="w-full text-xs" onClick={handleSave}>
                                    <Save className="w-3.5 h-3.5 mr-1.5" />
                                    Save Node
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
