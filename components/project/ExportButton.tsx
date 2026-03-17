"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportData {
    nodes: {
        name: string;
        type: string;
        category: string;
        parameters: Record<string, { value: number; unit?: string }>;
        outputs: Record<string, number>;
    }[];
}

function exportCSV(data: ExportData) {
    // Gather all unique parameter and output keys
    const paramKeys = new Set<string>();
    const outputKeys = new Set<string>();
    for (const node of data.nodes) {
        Object.keys(node.parameters || {}).forEach((k) => paramKeys.add(k));
        Object.keys(node.outputs || {}).forEach((k) => outputKeys.add(k));
    }

    const pKeys = Array.from(paramKeys);
    const oKeys = Array.from(outputKeys);

    const headers = ["Node Name", "Type", "Category", ...pKeys.map(k => `param:${k}`), ...oKeys.map(k => `output:${k}`)];
    const rows = data.nodes.map((node) => {
        const paramValues = pKeys.map((k) => {
            const p = node.parameters?.[k];
            return p ? `${p.value}${p.unit ? ` ${p.unit}` : ""}` : "";
        });
        const outputValues = oKeys.map((k) => {
            const v = node.outputs?.[k];
            return v !== undefined ? v.toFixed(4) : "";
        });
        return [node.name, node.type, node.category, ...paramValues, ...outputValues];
    });

    const csv = [headers, ...rows].map((r) => r.map(v => `"${v}"`).join(",")).join("\n");
    downloadFile(csv, "calculations.csv", "text/csv");
}

function exportJSON(data: ExportData) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, "calculations.json", "application/json");
}

function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function ExportButton({ data }: { data: ExportData }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                }
            />
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCSV(data)}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportJSON(data)}>
                    <FileJson className="w-4 h-4 mr-2" />
                    Export as JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
