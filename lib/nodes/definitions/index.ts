import { NodeDefinition } from "./types";

export const streamNode: NodeDefinition = {
    type: "stream",
    label: "Stream",
    category: "Streams",
    icon: "Waves",
    color: "#3b82f6",
    inputs: [],
    parameters: [
        { name: "temperature", label: "Temperature", unit: "°C", defaultValue: 25 },
        { name: "pressure", label: "Pressure", unit: "kPa", defaultValue: 101.325 },
        { name: "flow_rate", label: "Flow Rate", unit: "kg/s", defaultValue: 1 },
        { name: "Cp", label: "Heat Capacity", unit: "kJ/(kg·°C)", defaultValue: 4.18 },
    ],
    equations: [],
    outputs: [
        { name: "temperature", label: "Temperature", unit: "°C" },
        { name: "pressure", label: "Pressure", unit: "kPa" },
        { name: "flow_rate", label: "Flow Rate", unit: "kg/s" },
        { name: "Cp", label: "Cp", unit: "kJ/(kg·°C)" },
    ],
};

export const pumpNode: NodeDefinition = {
    type: "pump",
    label: "Pump",
    category: "Transport",
    icon: "Cog",
    color: "#8b5cf6",
    inputs: [
        { name: "flow_rate", label: "Flow Rate", unit: "kg/s" },
        { name: "Pin", label: "Inlet Pressure", unit: "kPa" },
    ],
    parameters: [
        { name: "dP", label: "Pressure Rise", unit: "kPa", defaultValue: 200 },
        { name: "efficiency", label: "Efficiency", unit: "", defaultValue: 0.75, min: 0.1, max: 1 },
        { name: "density", label: "Fluid Density", unit: "kg/m³", defaultValue: 1000 },
    ],
    equations: [
        "Pout = Pin + dP",
        "W = flow_rate * dP / (density * efficiency)",
    ],
    outputs: [
        { name: "Pout", label: "Outlet Pressure", unit: "kPa" },
        { name: "W", label: "Power", unit: "kW" },
    ],
};

export const heaterNode: NodeDefinition = {
    type: "heater",
    label: "Heater",
    category: "Heat Transfer",
    icon: "Flame",
    color: "#ef4444",
    inputs: [
        { name: "flow_rate", label: "Flow Rate", unit: "kg/s" },
        { name: "Cp", label: "Cp", unit: "kJ/(kg·°C)" },
        { name: "Tin", label: "Inlet Temp", unit: "°C" },
    ],
    parameters: [
        { name: "Tout", label: "Outlet Temp", unit: "°C", defaultValue: 80 },
    ],
    equations: ["Q = flow_rate * Cp * (Tout - Tin)"],
    outputs: [
        { name: "Q", label: "Duty", unit: "kW" },
        { name: "Tout", label: "Outlet Temp", unit: "°C" },
    ],
};

export const heatExchangerNode: NodeDefinition = {
    type: "heat_exchanger",
    label: "Heat Exchanger",
    category: "Heat Transfer",
    icon: "ArrowLeftRight",
    color: "#f59e0b",
    inputs: [
        { name: "flow_rate", label: "Flow Rate", unit: "kg/s" },
        { name: "Cp", label: "Cp", unit: "kJ/(kg·°C)" },
        { name: "Tin", label: "Inlet Temp", unit: "°C" },
    ],
    parameters: [
        { name: "Tout", label: "Outlet Temp", unit: "°C", defaultValue: 60 },
        { name: "U", label: "Overall HTC", unit: "kW/(m²·°C)", defaultValue: 0.5 },
        { name: "LMTD", label: "LMTD", unit: "°C", defaultValue: 30 },
    ],
    equations: [
        "Q = flow_rate * Cp * (Tin - Tout)",
        "A = Q / (U * LMTD)",
    ],
    outputs: [
        { name: "Q", label: "Duty", unit: "kW" },
        { name: "A", label: "Area", unit: "m²" },
        { name: "Tout", label: "Outlet Temp", unit: "°C" },
    ],
};

export const reactorNode: NodeDefinition = {
    type: "reactor",
    label: "Reactor",
    category: "Reaction",
    icon: "FlaskConical",
    color: "#10b981",
    inputs: [
        { name: "feed_rate", label: "Feed Rate", unit: "kg/s" },
    ],
    parameters: [
        { name: "conversion", label: "Conversion", unit: "", defaultValue: 0.85, min: 0, max: 1 },
        { name: "selectivity", label: "Selectivity", unit: "", defaultValue: 0.95, min: 0, max: 1 },
    ],
    equations: [
        "product_rate = feed_rate * conversion * selectivity",
        "unreacted = feed_rate * (1 - conversion)",
    ],
    outputs: [
        { name: "product_rate", label: "Product Rate", unit: "kg/s" },
        { name: "unreacted", label: "Unreacted", unit: "kg/s" },
    ],
};

export const mixerNode: NodeDefinition = {
    type: "mixer",
    label: "Mixer",
    category: "Streams",
    icon: "GitMerge",
    color: "#06b6d4",
    inputs: [
        { name: "flow_1", label: "Flow 1", unit: "kg/s" },
        { name: "flow_2", label: "Flow 2", unit: "kg/s" },
    ],
    parameters: [],
    equations: ["total_flow = flow_1 + flow_2"],
    outputs: [
        { name: "total_flow", label: "Total Flow", unit: "kg/s" },
    ],
};

export const separatorNode: NodeDefinition = {
    type: "separator",
    label: "Separator",
    category: "Separation",
    icon: "Split",
    color: "#ec4899",
    inputs: [
        { name: "feed_rate", label: "Feed Rate", unit: "kg/s" },
    ],
    parameters: [
        { name: "split_ratio", label: "Split Ratio", unit: "", defaultValue: 0.5, min: 0, max: 1 },
    ],
    equations: [
        "top_flow = feed_rate * split_ratio",
        "bottom_flow = feed_rate * (1 - split_ratio)",
    ],
    outputs: [
        { name: "top_flow", label: "Top Flow", unit: "kg/s" },
        { name: "bottom_flow", label: "Bottom Flow", unit: "kg/s" },
    ],
};
