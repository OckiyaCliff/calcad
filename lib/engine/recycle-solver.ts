import { GraphNode, GraphEdge, topologicalSort } from "./graph";
import { evaluateNodeEquations, EvalContext, UnitMapping } from "./evaluator";
import { convertUnit } from "./units";

export interface SolverStatus {
    converged: boolean;
    iterations: number;
    error: number;
    active: boolean;
}

/**
 * Finds cycles in the graph and returns the "back-edges" that can serve as tear streams.
 */
export function findTearEdges(nodeIds: string[], edges: GraphEdge[]): GraphEdge[] {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const tearEdges: GraphEdge[] = [];

    const adj = new Map<string, GraphEdge[]>();
    for (const edge of edges) {
        if (!adj.has(edge.source)) adj.set(edge.source, []);
        adj.get(edge.source)!.push(edge);
    }

    function dfs(nodeId: string) {
        visited.add(nodeId);
        recStack.add(nodeId);

        const neighbors = adj.get(nodeId) || [];
        for (const edge of neighbors) {
            if (!visited.has(edge.target)) {
                dfs(edge.target);
            } else if (recStack.has(edge.target)) {
                // Back-edge found! This is a cycle.
                tearEdges.push(edge);
            }
        }

        recStack.delete(nodeId);
    }

    for (const nodeId of nodeIds) {
        if (!visited.has(nodeId)) {
            dfs(nodeId);
        }
    }

    return tearEdges;
}

/**
 * Iterative solver using Successive Substitution with Wegstein Acceleration.
 * Handles recycle loops in the process graph.
 */
export function solveRecycleGraph(
    nodes: Map<string, GraphNode>,
    edges: GraphEdge[],
    maxIter: number = 30,
    tolerance: number = 1e-4
): { results: Map<string, Record<string, number>>; status: SolverStatus } {
    const nodeIds = Array.from(nodes.keys());
    const tearEdges = findTearEdges(nodeIds, edges);
    const acyclicEdges = edges.filter(e => !tearEdges.some(te => 
        te.source === e.source && 
        te.target === e.target && 
        te.sourceHandle === e.sourceHandle && 
        te.targetHandle === e.targetHandle
    ));
    
    // Wegstein internal states
    const tearValuesOld = new Map<string, number>();
    const x_prev = new Map<string, number>();
    const g_prev = new Map<string, number>();

    let iterations = 0;
    let currentResults = new Map<string, Record<string, number>>();
    let solverStatus: SolverStatus = { converged: false, iterations: 0, error: 1.0, active: true };

    // Topological order for the acyclic part of the graph
    const executionOrder = topologicalSort(nodeIds, acyclicEdges);

    while (iterations < maxIter) {
        iterations++;
        let maxResidue = 0;
        const newResults = new Map<string, Record<string, number>>();

        // Evaluation Pass
        for (const nodeId of executionOrder) {
            const node = nodes.get(nodeId);
            if (!node) continue;

            const context: EvalContext = {};
            const unitMapping: UnitMapping = {};
            
            for (const [key, param] of Object.entries(node.parameters)) {
                context[key] = param.value;
                if (param.unit) unitMapping[key] = param.unit;
            }
            for (const [key, val] of Object.entries(node.inputs)) {
                context[key] = val;
                if (node.inputUnits?.[key]) unitMapping[key] = node.inputUnits[key];
            }
            if (node.outputUnits) {
                for (const [key, unitStr] of Object.entries(node.outputUnits)) {
                    unitMapping[key] = unitStr;
                }
            }

            const fullContext = evaluateNodeEquations(
                node.equations, 
                context, 
                unitMapping, 
                node.fluidId, 
                node.mixtureComposition
            );

            const outputs: Record<string, number> = {};
            for (const key of Object.keys(node.outputs)) {
                if (fullContext[key] !== undefined) outputs[key] = fullContext[key];
            }
            newResults.set(nodeId, outputs);

            // Propagate to internal acyclic connections
            const downstreamEdges = edges.filter(e => e.source === nodeId);
            for (const edge of downstreamEdges) {
                const targetNode = nodes.get(edge.target);
                if (targetNode && edge.sourceHandle && edge.targetHandle) {
                    const sourceVal = outputs[edge.sourceHandle];
                    if (sourceVal !== undefined) {
                        const sourceUnit = node.outputUnits?.[edge.sourceHandle];
                        const targetUnit = targetNode.inputUnits?.[edge.targetHandle];
                        let finalValue = sourceVal;
                        
                        if (sourceUnit && targetUnit && sourceUnit !== targetUnit) {
                            const converted = convertUnit(sourceVal, sourceUnit, targetUnit);
                            if (converted !== null) finalValue = converted;
                        }
                        
                        targetNode.inputs[edge.targetHandle] = finalValue;
                    }
                }
            }
        }

        currentResults = newResults;

        // Convergence Check & Acceleration on Tear Streams
        const residuals: number[] = [];
        for (const te of tearEdges) {
            const edgeId = `${te.source}_${te.sourceHandle}_${te.target}_${te.targetHandle}`;
            const targetNode = nodes.get(te.target);
            if (!targetNode || !te.targetHandle) continue;

            const newVal = targetNode.inputs[te.targetHandle] || 0;
            const oldVal = tearValuesOld.get(edgeId) || 0;
            
            const residue = Math.abs(newVal - oldVal) / (Math.abs(oldVal) + 1e-7);
            residuals.push(residue);

            // Acceleration
            if (iterations > 1) {
                const x_n = oldVal;
                const g_n = newVal;
                const x_n_1 = x_prev.get(edgeId) || 0;
                const g_n_1 = g_prev.get(edgeId) || 0;

                const slope = (g_n - g_n_1) / (x_n - x_n_1 + 1e-10);
                const w = Math.max(-1.5, Math.min(0.4, slope / (slope - 1 + 1e-10))); 
                const accelerated = (1 - w) * g_n + w * x_n;
                
                tearValuesOld.set(edgeId, accelerated);
                // Update target input for next iteration
                targetNode.inputs[te.targetHandle] = accelerated;
            } else {
                tearValuesOld.set(edgeId, newVal);
            }

            x_prev.set(edgeId, oldVal);
            g_prev.set(edgeId, newVal);
        }

        maxResidue = residuals.length > 0 ? Math.max(...residuals) : 0;
        solverStatus.error = maxResidue;
        solverStatus.iterations = iterations;

        if (maxResidue < tolerance || tearEdges.length === 0) {
            solverStatus.converged = true;
            break;
        }
    }

    return { results: currentResults, status: solverStatus };
}
