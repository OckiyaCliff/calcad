import { evaluateNodeEquations, EvalContext, UnitMapping } from "./evaluator";
import { convertUnit } from "./units";

export interface GraphNode {
    id: string;
    parameters: Record<string, { value: number; unit?: string }>;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
    inputUnits?: Record<string, string>;
    outputUnits?: Record<string, string>;
    equations: string[];
}

export interface GraphEdge {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

/**
 * Build an adjacency list from edges.
 */
function buildAdjacencyList(
    edges: GraphEdge[]
): Map<string, { targetId: string; sourceHandle?: string; targetHandle?: string }[]> {
    const adj = new Map<string, { targetId: string; sourceHandle?: string; targetHandle?: string }[]>();
    for (const edge of edges) {
        const existing = adj.get(edge.source) || [];
        existing.push({
            targetId: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
        });
        adj.set(edge.source, existing);
    }
    return adj;
}

/**
 * Topological sort using Kahn's algorithm.
 */
export function topologicalSort(
    nodeIds: string[],
    edges: GraphEdge[]
): string[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const nodeId of nodeIds) {
        inDegree.set(nodeId, 0);
        adj.set(nodeId, []);
    }

    for (const edge of edges) {
        adj.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
        const current = queue.shift()!;
        sorted.push(current);

        for (const neighbor of adj.get(current) || []) {
            const newDegree = (inDegree.get(neighbor) || 1) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    return sorted;
}

/**
 * Re-evaluate the entire graph. Called when a node changes.
 * Handles unit conversion during propagation.
 */
export function recalculateGraph(
    nodes: Map<string, GraphNode>,
    edges: GraphEdge[]
): Map<string, Record<string, number>> {
    const nodeIds = Array.from(nodes.keys());
    const executionOrder = topologicalSort(nodeIds, edges);
    const adj = buildAdjacencyList(edges);
    const results = new Map<string, Record<string, number>>();

    for (const nodeId of executionOrder) {
        const node = nodes.get(nodeId);
        if (!node) continue;

        // 1. Build context and unit mapping
        const context: EvalContext = {};
        const unitMapping: UnitMapping = {};

        // Add parameters
        for (const [key, param] of Object.entries(node.parameters)) {
            context[key] = param.value;
            if (param.unit) unitMapping[key] = param.unit;
        }

        // Add inputs from upstream connections
        for (const [key, val] of Object.entries(node.inputs)) {
            context[key] = val;
            const inputUnit = node.inputUnits?.[key];
            if (inputUnit) unitMapping[key] = inputUnit;
        }

        // Ensure output units are in the mapping so mathjs knows how to convert the result
        if (node.outputUnits) {
            for (const [key, unitStr] of Object.entries(node.outputUnits)) {
                unitMapping[key] = unitStr;
            }
        }

        // 2. Evaluate equations with unit awareness
        const fullContext = evaluateNodeEquations(node.equations, context, unitMapping);

        // 3. Extract outputs
        const outputs: Record<string, number> = {};
        for (const key of Object.keys(node.outputs)) {
            if (fullContext[key] !== undefined) {
                outputs[key] = fullContext[key];
            }
        }

        results.set(nodeId, outputs);

        // 4. Propagate outputs to downstream nodes with AUTO-CONVERSION
        for (const connection of adj.get(nodeId) || []) {
            const targetNode = nodes.get(connection.targetId);
            if (targetNode && connection.sourceHandle && connection.targetHandle) {
                const sourceVal = outputs[connection.sourceHandle];
                if (sourceVal !== undefined) {
                    const sourceUnit = node.outputUnits?.[connection.sourceHandle];
                    const targetUnit = targetNode.inputUnits?.[connection.targetHandle];

                    let finalValue = sourceVal;
                    // If target unit is different, perform automatic conversion
                    if (sourceUnit && targetUnit && sourceUnit !== targetUnit) {
                        const converted = convertUnit(sourceVal, sourceUnit, targetUnit);
                        if (converted !== null) {
                            finalValue = converted;
                        }
                    }
                    
                    targetNode.inputs[connection.targetHandle] = finalValue;
                }
            }
        }
    }

    return results;
}
