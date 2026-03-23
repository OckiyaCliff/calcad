"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Beaker, Save, Trash2, ShieldCheck, Code } from "lucide-react";
import { registry, BUILTIN_COMPONENTS } from "@/lib/engine/properties/registry";
import { Component, PropertyModel } from "@/lib/engine/properties/types";
import { id as instantId, tx } from "@instantdb/react";
import { db } from "@/lib/instantdb";
import { Separator } from "@/components/ui/separator";

export function ComponentManager() {
    const [isOpen, setIsOpen] = useState(false);
    const { isLoading, error, data } = db.useQuery({ custom_components: {} }) as any;
    const [isAdding, setIsAdding] = useState(false);
    
    const [newComp, setNewComp] = useState<Partial<Component>>({
        name: "",
        formula: "",
        molarMass: 0,
        properties: {
            cp: { type: 'polynomial', coefficients: [0, 0, 0] },
            density: { type: 'constant', value: 1000 }
        }
    });

    const handleSave = () => {
        if (!newComp.name) return;
        
        const newId = instantId();
        db.transact([
            tx.custom_components[newId]
                .update({
                    ...newComp,
                    id: newId,
                    isCustom: true,
                    createdAt: Date.now()
                } as any)
        ]);
        
        setIsAdding(false);
        setNewComp({
            name: "",
            formula: "",
            molarMass: 0,
            properties: {
                cp: { type: 'polynomial', coefficients: [0, 0, 0] },
                density: { type: 'constant', value: 1000 }
            }
        });
    };

    const handleDelete = (id: string) => {
        db.transact([tx.custom_components[id].delete()]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger>
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs border rounded-md cursor-pointer bg-background border-primary/20 hover:bg-primary/5">
                    <Beaker className="w-4 h-4 text-primary" />
                    <span>Manage Components</span>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-primary" />
                        Component & Property Registry
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        Define project-specific chemical components and property correlations.
                    </p>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden border-t border-border mt-4">
                    {/* Sidebar: List of Components */}
                    <div className="w-1/3 border-r border-border bg-muted/30 flex flex-col">
                        <div className="p-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full gap-2 text-xs border-dashed border-primary/30 hover:border-primary/50"
                                onClick={() => setIsAdding(true)}
                            >
                                <Plus className="w-3 h-3" />
                                Add New Component
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-1.5 space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1">Built-in</p>
                                {BUILTIN_COMPONENTS.map(c => (
                                    <div key={c.id} className="flex flex-col px-3 py-2 rounded-md hover:bg-muted text-xs cursor-default">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">{c.name}</span>
                                            <ShieldCheck className="w-3 h-3 text-green-500" />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{c.formula || '—'}</span>
                                    </div>
                                ))}
                                
                                <Separator className="my-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1">Custom</p>
                                {data?.custom_components?.map((c: any) => (
                                    <div key={c.id} className="group flex flex-col px-3 py-2 rounded-md hover:bg-muted text-xs relative pr-8">
                                        <span className="font-semibold">{c.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{c.formula || '—'}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 absolute right-1 top-2 opacity-0 group-hover:opacity-100 text-destructive"
                                            onClick={() => handleDelete(c.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col">
                        {isAdding ? (
                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Component Name</Label>
                                            <Input 
                                                className="h-8 text-xs" 
                                                placeholder="e.g. Propane" 
                                                value={newComp.name}
                                                onChange={e => setNewComp({...newComp, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Formula</Label>
                                            <Input 
                                                className="h-8 text-xs font-mono" 
                                                placeholder="e.g. C3H8"
                                                value={newComp.formula}
                                                onChange={e => setNewComp({...newComp, formula: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Molar Mass (kg/mol)</Label>
                                        <Input 
                                            type="number" 
                                            className="h-8 text-xs font-mono" 
                                            value={newComp.molarMass}
                                            onChange={e => setNewComp({...newComp, molarMass: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>

                                    <Separator />
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Code className="w-4 h-4 text-primary" />
                                            <h4 className="text-[11px] font-bold uppercase tracking-tight">Property Correlations</h4>
                                        </div>

                                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-4">
                                            <div>
                                                <Label className="text-[10px] uppercase font-bold text-primary">Heat Capacity Cp(T)</Label>
                                                <p className="text-[10px] text-muted-foreground mb-2">Polynomial: A + BT + CT²</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[0,1,2].map(i => (
                                                        <Input 
                                                            key={i}
                                                            type="number" 
                                                            className="h-8 text-xs font-mono" 
                                                            placeholder={`Coeff ${i}`}
                                                            value={newComp.properties?.cp?.coefficients?.[i]}
                                                            onChange={e => {
                                                                const coeffs = [...(newComp.properties?.cp?.coefficients || [0,0,0])];
                                                                coeffs[i] = parseFloat(e.target.value) || 0;
                                                                setNewComp({...newComp, properties: {...newComp.properties, cp: {type: 'polynomial', coefficients: coeffs}}});
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-[10px] uppercase font-bold text-primary">Density ρ(T, P)</Label>
                                                <p className="text-[10px] text-muted-foreground mb-2">Constant or Custom Equation (DSL)</p>
                                                <div className="flex gap-2">
                                                    <Input 
                                                        className="h-8 text-xs font-mono flex-1" 
                                                        placeholder="Constant value or math expression"
                                                        value={newComp.properties?.density?.value || newComp.properties?.density?.formula}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const isNum = !isNaN(parseFloat(val));
                                                            setNewComp({
                                                                ...newComp, 
                                                                properties: {
                                                                    ...newComp.properties, 
                                                                    density: isNum ? {type: 'constant', value: parseFloat(val)} : {type: 'equation', formula: val}
                                                                }
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
                                <div className="p-4 rounded-full bg-primary/5 mb-4">
                                    <Beaker className="w-8 h-8 text-primary/40" />
                                </div>
                                <h4 className="text-sm font-semibold mb-1">Properties Dashboard</h4>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    Select a component from the registry to view details, or add a new custom fluid to your project.
                                </p>
                            </div>
                        )}
                        
                        {isAdding && (
                            <div className="p-4 border-t border-border flex justify-end gap-2 bg-background">
                                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                                <Button size="sm" className="gap-2" onClick={handleSave}>
                                    <Save className="w-3.5 h-3.5" />
                                    Save Component
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
