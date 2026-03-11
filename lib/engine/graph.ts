import { evaluateNodeEquations, EvalContext } from "./evaluator";

export interface GraphNode {
    id: string;
    parameters: Record<string, { value: number }>;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
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
 * Returns nodes in execution order.
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
 * Get all downstream node IDs starting from a changed node.
 */
export function getDownstreamNodes(
    changedNodeId: string,
    edges: GraphEdge[]
): Set<string> {
    const adj = buildAdjacencyList(edges);
    const visited = new Set<string>();
    const queue = [changedNodeId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        for (const neighbor of adj.get(current) || []) {
            queue.push(neighbor.targetId);
        }
    }

    visited.delete(changedNodeId); // Don't include the changed node itself
    return visited;
}

/**
 * Re-evaluate the entire graph. Called when a node changes.
 * Returns updated node outputs.
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

        // Build context from parameters
        const context: EvalContext = {};
        for (const [key, param] of Object.entries(node.parameters)) {
            context[key] = param.value;
        }

        // Add inputs from upstream connections
        for (const [key, val] of Object.entries(node.inputs)) {
            if (typeof val === "number") {
                context[key] = val;
            }
        }

        // Evaluate equations
        const fullContext = evaluateNodeEquations(node.equations, context);

        // Extract outputs
        const outputs: Record<string, number> = {};
        for (const key of Object.keys(node.outputs)) {
            if (fullContext[key] !== undefined) {
                outputs[key] = fullContext[key];
            }
        }

        results.set(nodeId, outputs);

        // Propagate outputs to downstream nodes
        for (const connection of adj.get(nodeId) || []) {
            const targetNode = nodes.get(connection.targetId);
            if (targetNode && connection.sourceHandle && connection.targetHandle) {
                const outputVal = outputs[connection.sourceHandle];
                if (outputVal !== undefined) {
                    targetNode.inputs[connection.targetHandle] = outputVal;
                }
            }
        }
    }

    return results;
}
