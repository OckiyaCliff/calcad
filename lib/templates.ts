// Built-in process templates for calCAd

export interface ProcessTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    nodes: TemplateNode[];
    edges: TemplateEdge[];
}

interface TemplateNode {
    localId: string; // local reference for edge mapping
    type: string;
    label: string;
    positionX: number;
    positionY: number;
    parameters: Record<string, { value: number; unit?: string }>;
}

interface TemplateEdge {
    sourceLocalId: string;
    targetLocalId: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export const builtInTemplates: ProcessTemplate[] = [
    {
        id: "simple-heat-exchange",
        name: "Simple Heat Exchange",
        description:
            "A basic heat exchanger setup: hot feed stream → heat exchanger → cooled product. Great for learning heat duty calculations.",
        category: "Heat Transfer",
        icon: "Flame",
        difficulty: "beginner",
        nodes: [
            {
                localId: "feed",
                type: "stream",
                label: "Hot Feed",
                positionX: 100,
                positionY: 200,
                parameters: {
                    temperature: { value: 150, unit: "°C" },
                    pressure: { value: 300, unit: "kPa" },
                    flow_rate: { value: 10, unit: "kg/s" },
                    composition: { value: 1, unit: "mol frac" },
                },
            },
            {
                localId: "hx",
                type: "heat_exchanger",
                label: "Shell & Tube HX",
                positionX: 400,
                positionY: 200,
                parameters: {
                    U: { value: 500, unit: "W/m²·K" },
                    A: { value: 20, unit: "m²" },
                    Tc_in: { value: 25, unit: "°C" },
                    Tc_out: { value: 80, unit: "°C" },
                },
            },
        ],
        edges: [
            {
                sourceLocalId: "feed",
                targetLocalId: "hx",
                sourceHandle: "temperature",
                targetHandle: "Th_in",
            },
        ],
    },
    {
        id: "pump-and-heat",
        name: "Pump → Heater Pipeline",
        description:
            "A common industrial setup: feed stream is pumped to higher pressure, then heated before entering a reactor. Demonstrates cascading calculations.",
        category: "Process Design",
        icon: "Cog",
        difficulty: "beginner",
        nodes: [
            {
                localId: "feed",
                type: "stream",
                label: "Raw Feed",
                positionX: 50,
                positionY: 200,
                parameters: {
                    temperature: { value: 25, unit: "°C" },
                    pressure: { value: 101.3, unit: "kPa" },
                    flow_rate: { value: 8, unit: "kg/s" },
                    composition: { value: 1, unit: "mol frac" },
                },
            },
            {
                localId: "pump",
                type: "pump",
                label: "Feed Pump",
                positionX: 300,
                positionY: 200,
                parameters: {
                    dP: { value: 400, unit: "kPa" },
                    efficiency: { value: 0.75, unit: "" },
                    density: { value: 1000, unit: "kg/m³" },
                },
            },
            {
                localId: "heater",
                type: "heater",
                label: "Pre-Heater",
                positionX: 550,
                positionY: 200,
                parameters: {
                    Tout: { value: 180, unit: "°C" },
                    Cp: { value: 4.18, unit: "kJ/(kg·°C)" },
                },
            },
        ],
        edges: [
            {
                sourceLocalId: "feed",
                targetLocalId: "pump",
                sourceHandle: "flow_rate",
                targetHandle: "flow_rate",
            },
            {
                sourceLocalId: "pump",
                targetLocalId: "heater",
                sourceHandle: "power",
                targetHandle: "Tin",
            },
        ],
    },
    {
        id: "reactor-separator",
        name: "Reactor → Separator Unit",
        description:
            "A reactor converts feed into product, then a separator splits the mixture. Useful for understanding conversion, selectivity, and separation efficiency.",
        category: "Reaction Engineering",
        icon: "FlaskConical",
        difficulty: "intermediate",
        nodes: [
            {
                localId: "feed",
                type: "stream",
                label: "Reactor Feed",
                positionX: 50,
                positionY: 200,
                parameters: {
                    temperature: { value: 200, unit: "°C" },
                    pressure: { value: 500, unit: "kPa" },
                    flow_rate: { value: 50, unit: "kg/s" },
                    composition: { value: 0.95, unit: "mol frac" },
                },
            },
            {
                localId: "reactor",
                type: "reactor",
                label: "CSTR Reactor",
                positionX: 300,
                positionY: 200,
                parameters: {
                    conversion: { value: 0.85, unit: "" },
                    selectivity: { value: 0.92, unit: "" },
                    temperature: { value: 350, unit: "°C" },
                },
            },
            {
                localId: "sep",
                type: "separator",
                label: "Flash Separator",
                positionX: 550,
                positionY: 200,
                parameters: {
                    split_fraction: { value: 0.9, unit: "" },
                    temperature: { value: 100, unit: "°C" },
                    pressure: { value: 200, unit: "kPa" },
                },
            },
        ],
        edges: [
            {
                sourceLocalId: "feed",
                targetLocalId: "reactor",
                sourceHandle: "flow_rate",
                targetHandle: "feed_rate",
            },
            {
                sourceLocalId: "reactor",
                targetLocalId: "sep",
                sourceHandle: "product_rate",
                targetHandle: "feed_rate",
            },
        ],
    },
    {
        id: "full-process-train",
        name: "Complete Process Train",
        description:
            "A full four-stage process: Feed → Pump → Heater → Reactor → Separator. Demonstrates end-to-end material and energy balances across multiple unit operations.",
        category: "Process Design",
        icon: "Boxes",
        difficulty: "advanced",
        nodes: [
            {
                localId: "feed",
                type: "stream",
                label: "Plant Feed",
                positionX: 50,
                positionY: 250,
                parameters: {
                    temperature: { value: 25, unit: "°C" },
                    pressure: { value: 101.3, unit: "kPa" },
                    flow_rate: { value: 100, unit: "kg/s" },
                    composition: { value: 1, unit: "mol frac" },
                },
            },
            {
                localId: "pump",
                type: "pump",
                label: "Main Pump",
                positionX: 250,
                positionY: 250,
                parameters: {
                    dP: { value: 900, unit: "kPa" },
                    efficiency: { value: 0.8, unit: "" },
                    density: { value: 850, unit: "kg/m³" },
                },
            },
            {
                localId: "heater",
                type: "heater",
                label: "Feed Heater",
                positionX: 450,
                positionY: 250,
                parameters: {
                    Tout: { value: 250, unit: "°C" },
                    Cp: { value: 2.5, unit: "kJ/(kg·°C)" },
                },
            },
            {
                localId: "reactor",
                type: "reactor",
                label: "Main Reactor",
                positionX: 650,
                positionY: 250,
                parameters: {
                    conversion: { value: 0.9, unit: "" },
                    selectivity: { value: 0.88, unit: "" },
                    temperature: { value: 400, unit: "°C" },
                },
            },
            {
                localId: "sep",
                type: "separator",
                label: "Product Separator",
                positionX: 850,
                positionY: 250,
                parameters: {
                    split_fraction: { value: 0.95, unit: "" },
                    temperature: { value: 80, unit: "°C" },
                    pressure: { value: 150, unit: "kPa" },
                },
            },
        ],
        edges: [
            {
                sourceLocalId: "feed",
                targetLocalId: "pump",
                sourceHandle: "flow_rate",
                targetHandle: "flow_rate",
            },
            {
                sourceLocalId: "pump",
                targetLocalId: "heater",
                sourceHandle: "power",
                targetHandle: "Tin",
            },
            {
                sourceLocalId: "heater",
                targetLocalId: "reactor",
                sourceHandle: "Q",
                targetHandle: "feed_rate",
            },
            {
                sourceLocalId: "reactor",
                targetLocalId: "sep",
                sourceHandle: "product_rate",
                targetHandle: "feed_rate",
            },
        ],
    },
];

export function getTemplates(): ProcessTemplate[] {
    return builtInTemplates;
}

export function getTemplateById(id: string): ProcessTemplate | undefined {
    return builtInTemplates.find((t) => t.id === id);
}
