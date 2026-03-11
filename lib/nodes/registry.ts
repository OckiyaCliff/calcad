import { NodeDefinition } from "./definitions/types";
import {
    streamNode,
    pumpNode,
    heaterNode,
    heatExchangerNode,
    reactorNode,
    mixerNode,
    separatorNode,
} from "./definitions";

const builtInNodes: NodeDefinition[] = [
    streamNode,
    pumpNode,
    heaterNode,
    heatExchangerNode,
    reactorNode,
    mixerNode,
    separatorNode,
];

const registry = new Map<string, NodeDefinition>();

// Register built-in nodes
for (const def of builtInNodes) {
    registry.set(def.type, def);
}

export function getNodeDefinition(type: string): NodeDefinition | undefined {
    return registry.get(type);
}

export function getAllNodeDefinitions(): NodeDefinition[] {
    return Array.from(registry.values());
}

export function getNodesByCategory(): Record<string, NodeDefinition[]> {
    const categories: Record<string, NodeDefinition[]> = {};
    for (const def of registry.values()) {
        if (!categories[def.category]) {
            categories[def.category] = [];
        }
        categories[def.category].push(def);
    }
    return categories;
}

export function registerCustomNode(def: NodeDefinition): void {
    registry.set(def.type, def);
}

export { type NodeDefinition } from "./definitions/types";
