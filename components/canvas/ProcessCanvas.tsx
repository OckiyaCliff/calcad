"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Connection,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
    type Node as FlowNode,
    type Edge as FlowEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { EngineNode } from "@/components/nodes/EngineNode";
import { NodePalette } from "./NodePalette";
import { PropertiesPanel } from "./PropertiesPanel";
import { getNodeDefinition } from "@/lib/nodes/registry";
import { recalculateGraph, GraphNode, GraphEdge } from "@/lib/engine/graph";
import { evaluateNodeEquations, EvalContext } from "@/lib/engine/evaluator";
import { db } from "@/lib/instantdb";
import { id as instantId, tx } from "@instantdb/react";

// Define custom node data type
type EngineNodeData = {
    nodeType: string;
    label: string;
    parameters: Record<string, { value: number; unit: string }>;
    inputs: Record<string, { value: number; unit: string }>;
    computedOutputs: Record<string, { value: number; unit: string }>;
    equations: string[];
};

const nodeTypes = {
    engineNode: EngineNode,
};

let nodeIdCounter = 0;

function createFlowNode(
    type: string,
    position: { x: number; y: number }
): FlowNode {
    const def = getNodeDefinition(type);
    if (!def) {
        return {
            id: `node_${++nodeIdCounter}`,
            type: "engineNode",
            position,
            data: {
                nodeType: type,
                label: type,
                parameters: {},
                inputs: {},
                computedOutputs: {},
                equations: [],
            } as EngineNodeData,
        };
    }

    const parameters: Record<string, { value: number; unit: string }> = {};
    for (const p of def.parameters) {
        parameters[p.name] = { value: p.defaultValue, unit: p.unit };
    }

    const inputs: Record<string, { value: number; unit: string }> = {};
    for (const i of def.inputs) {
        inputs[i.name] = { value: i.defaultValue ?? 0, unit: i.unit || "" };
    }

    // Build initial context from parameters and inputs
    const initialContext: EvalContext = {};
    const initialUnits: Record<string, string> = {};
    
    for (const [key, param] of Object.entries(parameters)) {
        initialContext[key] = param.value;
        initialUnits[key] = param.unit;
    }
    for (const [key, input] of Object.entries(inputs)) {
        initialContext[key] = input.value;
        initialUnits[key] = input.unit;
    }

    const computedResults = evaluateNodeEquations(def.equations, initialContext, initialUnits);
    const computedOutputs: Record<string, { value: number; unit: string }> = {};
    
    for (const out of def.outputs) {
        const val = computedResults[out.name] ?? 0;
        computedOutputs[out.name] = { value: val, unit: out.unit || "" };
    }

    return {
        id: `node_${++nodeIdCounter}`,
        type: "engineNode",
        position,
        data: {
            nodeType: type,
            label: def.label,
            parameters,
            inputs,
            computedOutputs,
            equations: def.equations,
        } as EngineNodeData,
    };
}

// ─── Persistence helpers ───────────────────────────────────────

function serializeNodeForDB(node: FlowNode, projectId: string) {
    const d = node.data as EngineNodeData;
    return {
        projectId,
        type: d.nodeType,
        label: d.label,
        positionX: node.position.x,
        positionY: node.position.y,
        parameters: d.parameters,
        inputs: d.inputs,
        outputs: d.computedOutputs,
        equations: d.equations,
    };
}

function deserializeNodeFromDB(dbNode: any): FlowNode {
    return {
        id: dbNode.id,
        type: "engineNode",
        position: { x: dbNode.positionX, y: dbNode.positionY },
        data: {
            nodeType: dbNode.type,
            label: dbNode.label,
            parameters: dbNode.parameters || {},
            inputs: dbNode.inputs || {},
            computedOutputs: dbNode.outputs || {},
            equations: dbNode.equations || [],
        } as EngineNodeData,
    };
}

function serializeEdgeForDB(edge: FlowEdge, projectId: string) {
    return {
        projectId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || "",
        targetHandle: edge.targetHandle || "",
    };
}

function deserializeEdgeFromDB(dbEdge: any): FlowEdge {
    return {
        id: dbEdge.id,
        source: dbEdge.source,
        target: dbEdge.target,
        sourceHandle: dbEdge.sourceHandle || undefined,
        targetHandle: dbEdge.targetHandle || undefined,
        style: { stroke: "oklch(0.65 0.18 250)", strokeWidth: 2 },
        animated: true,
    };
}

// ─── Inner Canvas Component ────────────────────────────────────

function ProcessCanvasInner({ projectId }: { projectId: string }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([] as FlowNode[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([] as FlowEdge[]);
    const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHydratedRef = useRef(false);
    const isSavingRef = useRef(false);

    // ─── Load from InstantDB ───────────────────────────────────
    const { data: savedData, isLoading: isLoadingData } = db.useQuery({
        nodes: { $: { where: { projectId } } },
        edges: { $: { where: { projectId } } },
    });

    useEffect(() => {
        if (isLoadingData || isHydratedRef.current || !savedData) return;

        const savedNodes = (savedData.nodes || []).map(deserializeNodeFromDB);
        const savedEdges = (savedData.edges || []).map(deserializeEdgeFromDB);

        if (savedNodes.length > 0) {
            for (const n of savedNodes) {
                const match = n.id.match(/node_(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num >= nodeIdCounter) nodeIdCounter = num + 1;
                }
            }
            setNodes(savedNodes);
            setEdges(savedEdges);

            setTimeout(() => {
                runRecalculation(savedNodes, savedEdges);
            }, 100);
        }

        isHydratedRef.current = true;
    }, [savedData, isLoadingData]);

    // ─── Debounced save to InstantDB ───────────────────────────
    const saveToDB = useCallback(
        (currentNodes: FlowNode[], currentEdges: FlowEdge[]) => {
            if (!projectId || !isHydratedRef.current || isSavingRef.current) return;

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

            saveTimerRef.current = setTimeout(async () => {
                isSavingRef.current = true;
                try {
                    const existing = await db.queryOnce({
                        nodes: { $: { where: { projectId } } },
                        edges: { $: { where: { projectId } } },
                    });

                    const deleteTxns: any[] = [];
                    for (const n of existing.data.nodes || []) {
                        deleteTxns.push(tx.nodes[n.id].delete());
                    }
                    for (const e of existing.data.edges || []) {
                        deleteTxns.push(tx.edges[e.id].delete());
                    }

                    const createTxns: any[] = [];
                    for (const node of currentNodes) {
                        const dbId = instantId();
                        createTxns.push(tx.nodes[dbId].update(serializeNodeForDB(node, projectId)));
                    }

                    for (const edge of currentEdges) {
                        const dbId = instantId();
                        createTxns.push(tx.edges[dbId].update(serializeEdgeForDB(edge, projectId)));
                    }

                    if (deleteTxns.length > 0 || createTxns.length > 0) {
                        await db.transact([...deleteTxns, ...createTxns]);
                    }
                } catch (err) {
                    console.error("Failed to save canvas:", err);
                } finally {
                    isSavingRef.current = false;
                }
            }, 800);
        },
        [projectId]
    );

    useEffect(() => {
        if (!isHydratedRef.current) return;
        saveToDB(nodes, edges);
    }, [nodes, edges, saveToDB]);

    // ─── Recalculate graph ─────────────────────────────────────
    const runRecalculation = useCallback(
        (currentNodes: FlowNode[], currentEdges: FlowEdge[]) => {
            const graphNodes = new Map<string, GraphNode>();
            for (const node of currentNodes) {
                const d = node.data as EngineNodeData;
                
                const params: Record<string, { value: number; unit?: string }> = {};
                if (d.parameters) {
                    for (const [k, v] of Object.entries(d.parameters)) {
                        params[k] = { value: v.value, unit: v.unit };
                    }
                }

                const inputs: Record<string, number> = {};
                const inputUnits: Record<string, string> = {};
                if (d.inputs) {
                    for (const [k, v] of Object.entries(d.inputs)) {
                        inputs[k] = v.value;
                        inputUnits[k] = v.unit;
                    }
                }

                const outputs: Record<string, number> = {};
                const outputUnits: Record<string, string> = {};
                if (d.computedOutputs) {
                    for (const [k, v] of Object.entries(d.computedOutputs)) {
                        outputs[k] = v.value;
                        outputUnits[k] = v.unit;
                    }
                }

                graphNodes.set(node.id, {
                    id: node.id,
                    parameters: params,
                    inputs,
                    outputs,
                    inputUnits,
                    outputUnits,
                    equations: d.equations || [],
                });
            }

            const graphEdges: GraphEdge[] = currentEdges.map((e) => ({
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle || undefined,
                targetHandle: e.targetHandle || undefined,
            }));

            const results = recalculateGraph(graphNodes, graphEdges);

            setNodes((nds: FlowNode[]) =>
                nds.map((node: FlowNode) => {
                    const nodeResults = results.get(node.id);
                    if (nodeResults) {
                        const data = node.data as EngineNodeData;
                        const updatedOutputs: Record<string, { value: number; unit: string }> = {};
                        
                        Object.entries(data.computedOutputs || {}).forEach(([k, v]) => {
                            updatedOutputs[k] = { 
                                value: nodeResults[k] ?? v.value, 
                                unit: v.unit 
                            };
                        });

                        return {
                            ...node,
                            data: {
                                ...data,
                                computedOutputs: updatedOutputs,
                                // Sync inputs back too
                                inputs: graphNodes.get(node.id)?.inputs 
                                    ? Object.fromEntries(
                                        Object.entries(graphNodes.get(node.id)!.inputs).map(([k, v]) => [
                                            k, { value: v, unit: data.inputs[k]?.unit || "" }
                                        ])
                                    ) 
                                    : data.inputs,
                            },
                        };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds: FlowEdge[]) => {
                const newEdges = addEdge(connection, eds);
                setTimeout(() => {
                    setNodes((currentNodes: FlowNode[]) => {
                        runRecalculation(currentNodes, newEdges as FlowEdge[]);
                        return currentNodes;
                    });
                }, 0);
                return newEdges as FlowEdge[];
            });
        },
        [setEdges, setNodes, runRecalculation]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const onNodesDelete = useCallback(
        (deletedNodes: FlowNode[]) => {
            setTimeout(() => {
                setNodes((currentNodes: FlowNode[]) => {
                    setEdges((currentEdges: FlowEdge[]) => {
                        runRecalculation(currentNodes, currentEdges);
                        return currentEdges;
                    });
                    return currentNodes;
                });
            }, 0);
        },
        [setNodes, setEdges, runRecalculation]
    );

    const onDeleteNode = useCallback(
        (nodeId: string) => {
            setNodes((nds: FlowNode[]) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds: FlowEdge[]) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            setSelectedNode(null);
        },
        [setNodes, setEdges]
    );

    const onUpdateParameter = useCallback(
        (nodeId: string, paramName: string, value: number, unit?: string) => {
            setNodes((nds: FlowNode[]) => {
                const updatedNodes = nds.map((node: FlowNode) => {
                    if (node.id !== nodeId) return node;
                    const d = node.data as EngineNodeData;
                    return {
                        ...node,
                        data: {
                            ...d,
                            parameters: {
                                ...d.parameters,
                                [paramName]: {
                                    value,
                                    unit: unit || d.parameters[paramName]?.unit || "",
                                },
                            },
                        },
                    };
                });
                runRecalculation(updatedNodes, edges);
                return updatedNodes;
            });
        },
        [setNodes, runRecalculation, edges]
    );

    return (
        <div className="flex h-full w-full overflow-hidden">
            <NodePalette onAddNode={(type) => setNodes((nds) => [...nds, createFlowNode(type, { x: 250, y: 150 })])} />
            
            <div className="relative flex-1" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onNodesDelete={onNodesDelete}
                    nodeTypes={nodeTypes}
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                >
                    <Background variant={BackgroundVariant.Dots} gap={30} size={1} />
                    <Controls />
                    <MiniMap zoomable pannable />
                </ReactFlow>
            </div>

            {selectedNode && (
                <PropertiesPanel
                    selectedNode={selectedNode}
                    onUpdateParameter={onUpdateParameter}
                    onDeleteNode={onDeleteNode}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
}

export function ProcessCanvas({ projectId }: { projectId: string }) {
    return (
        <ReactFlowProvider>
            <ProcessCanvasInner projectId={projectId} />
        </ReactFlowProvider>
    );
}
