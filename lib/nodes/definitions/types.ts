export interface PortDefinition {
    name: string;
    label: string;
    unit?: string;
    defaultValue?: number;
}

export interface ParameterDefinition {
    name: string;
    label: string;
    unit: string;
    defaultValue: number;
    min?: number;
    max?: number;
}

export interface NodeDefinition {
    type: string;
    label: string;
    category: string;
    icon: string;
    color: string;
    inputs: PortDefinition[];
    parameters: ParameterDefinition[];
    equations: string[];
    outputs: PortDefinition[];
}
