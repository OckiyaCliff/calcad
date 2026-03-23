"use client";

import { useState } from "react";
import { Beaker, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { parseReaction, calculateHeatOfReaction, isBalanced } from "@/lib/engine/reaction/parser";
import type { Reaction } from "@/lib/engine/reaction/types";

interface ReactionManagerProps {
    reactions: Reaction[];
    onAddReaction: (reaction: Reaction) => void;
    onRemoveReaction: (reactionId: string) => void;
}

export function ReactionManager({ reactions, onAddReaction, onRemoveReaction }: ReactionManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [equationInput, setEquationInput] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [preview, setPreview] = useState<Reaction | null>(null);
    const [balanced, setBalanced] = useState<boolean | null>(null);
    const [deltaHr, setDeltaHr] = useState<number | null>(null);

    const handleParse = () => {
        const parsed = parseReaction(equationInput, nameInput || undefined);
        setPreview(parsed);
        if (parsed) {
            setBalanced(isBalanced(parsed));
            setDeltaHr(calculateHeatOfReaction(parsed));
        } else {
            setBalanced(null);
            setDeltaHr(null);
        }
    };

    const handleAdd = () => {
        if (!preview) return;
        const rxn: Reaction = {
            ...preview,
            deltaHr: deltaHr ?? undefined,
        };
        onAddReaction(rxn);
        setEquationInput("");
        setNameInput("");
        setPreview(null);
        setBalanced(null);
        setDeltaHr(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger>
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs border rounded-md cursor-pointer bg-background border-emerald-500/30 hover:bg-emerald-500/5">
                    <Beaker className="w-4 h-4 text-emerald-500" />
                    <span>Reactions ({reactions.length})</span>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-emerald-500" />
                        Reaction Manager
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 space-y-3 pb-4">
                    <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Reaction Name (optional)</Label>
                        <Input
                            placeholder="e.g. Methane Combustion"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="h-8 text-xs mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Equation String</Label>
                        <Input
                            placeholder="CH4 + 2O2 -> CO2 + 2H2O"
                            value={equationInput}
                            onChange={(e) => setEquationInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleParse()}
                            className="h-8 text-xs font-mono mt-1"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={handleParse}>
                            Parse & Verify
                        </Button>
                        {preview && balanced !== null && (
                            <div className="flex items-center gap-1.5 text-xs">
                                {balanced ? (
                                    <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                        <Check className="w-3.5 h-3.5" /> Balanced
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Unbalanced
                                    </span>
                                )}
                                {deltaHr !== null && (
                                    <span className="ml-3 text-muted-foreground">
                                        ΔHr° = <strong className={deltaHr < 0 ? "text-blue-400" : "text-red-400"}>
                                            {(deltaHr / 1000).toFixed(2)} kJ/mol
                                        </strong>
                                        {deltaHr < 0 ? " (Exothermic)" : " (Endothermic)"}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {preview && (
                        <div className="p-3 rounded-md bg-muted/50 border border-border text-[10px] space-y-1.5">
                            <p className="font-bold text-muted-foreground uppercase">Parsed Reaction</p>
                            <div className="flex gap-2 items-center font-mono">
                                {preview.reactants.map((r, i) => (
                                    <span key={`r-${i}`}>
                                        {i > 0 && <span className="text-muted-foreground mx-1">+</span>}
                                        <span className="text-red-400">{r.coefficient > 1 ? r.coefficient : ""}{r.formula}</span>
                                    </span>
                                ))}
                                <span className="text-muted-foreground mx-1">{preview.reversible ? "⇌" : "→"}</span>
                                {preview.products.map((p, i) => (
                                    <span key={`p-${i}`}>
                                        {i > 0 && <span className="text-muted-foreground mx-1">+</span>}
                                        <span className="text-emerald-400">{p.coefficient > 1 ? p.coefficient : ""}{p.formula}</span>
                                    </span>
                                ))}
                            </div>
                            <Button size="sm" className="mt-2 h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}>
                                <Plus className="w-3 h-3 mr-1" /> Add Reaction
                            </Button>
                        </div>
                    )}
                </div>

                <Separator />

                <ScrollArea className="flex-1 px-6 py-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">
                        Defined Reactions ({reactions.length})
                    </p>
                    {reactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No reactions defined. Parse and add one above.</p>
                    ) : (
                        <div className="space-y-2">
                            {reactions.map((rxn) => (
                                <div
                                    key={rxn.id}
                                    className="p-3 rounded-md border border-border bg-background hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-semibold">{rxn.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                {rxn.equationString}
                                            </p>
                                            {rxn.deltaHr !== undefined && (
                                                <p className="text-[10px] mt-1">
                                                    ΔHr° = <span className={rxn.deltaHr < 0 ? "text-blue-400" : "text-red-400"}>
                                                        {(rxn.deltaHr / 1000).toFixed(2)} kJ/mol
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                            onClick={() => onRemoveReaction(rxn.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
