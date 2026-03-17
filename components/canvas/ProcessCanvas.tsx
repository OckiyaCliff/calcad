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
    type Node,
    type Edge,
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
    parameters: Record<string, { value: number; unit?: string }>;
    inputs: Record<string, number>;
    computedOutputs: Record<string, number>;
    equations: string[];
};

const nodeTypes = {
    engineNode: EngineNode,
};

let nodeIdCounter = 0;

function createFlowNode(
    type: string,
    position: { x: number; y: number }
): Node {
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

    // Build initial context from parameters
    const initialContext: EvalContext = {};
    for (const [key, param] of Object.entries(parameters)) {
        initialContext[key] = param.value;
    }

    const computedOutputs = evaluateNodeEquations(def.equations, initialContext);
    const outputs: Record<string, number> = {};
    for (const out of def.outputs) {
        if (computedOutputs[out.name] !== undefined) {
            outputs[out.name] = computedOutputs[out.name];
        } else if (initialContext[out.name] !== undefined) {
            outputs[out.name] = initialContext[out.name];
        }
    }

    return {
        id: `node_${++nodeIdCounter}`,
        type: "engineNode",
        position,
        data: {
            nodeType: type,
            label: def.label,
            parameters,
            inputs: {},
            computedOutputs: outputs,
            equations: def.equations,
        } as EngineNodeData,
    };
}

// ─── Persistence helpers ───────────────────────────────────────

function serializeNodeForDB(node: Node, projectId: string) {
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

function deserializeNodeFromDB(dbNode: any): Node {
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

function serializeEdgeForDB(edge: Edge, projectId: string) {
    return {
        projectId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || "",
        targetHandle: edge.targetHandle || "",
    };
}

function deserializeEdgeFromDB(dbEdge: any): Edge {
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
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
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
            // Update the node id counter to avoid collisions
            for (const n of savedNodes) {
                const match = n.id.match(/node_(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num >= nodeIdCounter) nodeIdCounter = num + 1;
                }
            }
            setNodes(savedNodes);
            setEdges(savedEdges);

            // Run recalculation after hydration
            setTimeout(() => {
                runRecalculation(savedNodes, savedEdges);
            }, 100);
        }

        isHydratedRef.current = true;
    }, [savedData, isLoadingData]);

    // ─── Debounced save to InstantDB ───────────────────────────
    const saveToDB = useCallback(
        (currentNodes: Node[], currentEdges: Edge[]) => {
            if (!projectId || !isHydratedRef.current || isSavingRef.current) return;

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

            saveTimerRef.current = setTimeout(async () => {
                isSavingRef.current = true;
                try {
                    // Delete old data for this project
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

                    // Create new data
                    const createTxns: any[] = [];
                    const nodeIdMap = new Map<string, string>(); // flowId -> dbId

                    for (const node of currentNodes) {
                        const dbId = instantId();
                        nodeIdMap.set(node.id, dbId);
                        createTxns.push(
                            tx.nodes[dbId].update(serializeNodeForDB(node, projectId))
                        );
                    }

                    for (const edge of currentEdges) {
                        const dbId = instantId();
                        createTxns.push(
                            tx.edges[dbId].update(serializeEdgeForDB(edge, projectId))
                        );
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

    // Auto-save when nodes or edges change (after hydration)
    useEffect(() => {
        if (!isHydratedRef.current) return;
        saveToDB(nodes, edges);
    }, [nodes, edges, saveToDB]);

    // ─── Recalculate graph ─────────────────────────────────────
    const runRecalculation = useCallback(
        (currentNodes: Node[], currentEdges: Edge[]) => {
            const graphNodes = new Map<string, GraphNode>();
            for (const node of currentNodes) {
                const d = node.data as EngineNodeData;
                const params: Record<string, { value: number }> = {};
                for (const [k, v] of Object.entries(d.parameters || {})) {
                    params[k] = { value: v.value };
                }

                const def = getNodeDefinition(d.nodeType);
                const outputKeys: Record<string, number> = {};
                if (def) {
                    for (const out of def.outputs) {
                        outputKeys[out.name] = 0;
                    }
                }

                graphNodes.set(node.id, {
                    id: node.id,
                    parameters: params,
                    inputs: { ...(d.inputs || {}) },
                    outputs: outputKeys,
                    equations: d.equations || def?.equations || [],
                });
            }

            const graphEdges: GraphEdge[] = currentEdges.map((e) => ({
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle || undefined,
                targetHandle: e.targetHandle || undefined,
            }));

            const results = recalculateGraph(graphNodes, graphEdges);

            setNodes((nds: Node[]) =>
                nds.map((node: Node) => {
                    const nodeResults = results.get(node.id);
                    const graphNode = graphNodes.get(node.id);
                    if (nodeResults) {
                        return {
                            ...node,
                            data: {
                                ...(node.data as EngineNodeData),
                                computedOutputs: nodeResults,
                                inputs: graphNode?.inputs || (node.data as EngineNodeData).inputs,
                            },
                        };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

    // ─── Connection handler ────────────────────────────────────
    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds: Edge[]) => {
                const newEdges = addEdge(connection, eds);
                setTimeout(() => {
                    setNodes((currentNodes: Node[]) => {
                        runRecalculation(currentNodes, newEdges as Edge[]);
                        return currentNodes;
                    });
                }, 0);
                return newEdges as Edge[];
            });
        },
        [setEdges, setNodes, runRecalculation]
    );

    // ─── Selection handlers ────────────────────────────────────
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // ─── Deletion handlers ─────────────────────────────────────
    const onNodesDelete = useCallback(
        (deletedNodes: Node[]) => {
            setSelectedNode((prev) => {
                if (prev && deletedNodes.some((n) => n.id === prev.id)) {
                    return null;
                }
                return prev;
            });
            setTimeout(() => {
                setNodes((currentNodes: Node[]) => {
                    setEdges((currentEdges: Edge[]) => {
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
            setNodes((nds: Node[]) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds: Edge[]) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            setSelectedNode(null);
            setTimeout(() => {
                setNodes((currentNodes: Node[]) => {
                    setEdges((currentEdges: Edge[]) => {
                        runRecalculation(currentNodes, currentEdges);
                        return currentEdges;
                    });
                    return currentNodes;
                });
            }, 0);
        },
        [setNodes, setEdges, runRecalculation]
    );

    // ─── Add node handlers ─────────────────────────────────────
    const addNode = useCallback(
        (type: string) => {
            const position = {
                x: 250 + Math.random() * 200,
                y: 150 + Math.random() * 200,
            };
            const newNode = createFlowNode(type, position);
            setNodes((nds: Node[]) => [...nds, newNode]);
        },
        [setNodes]
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const type = e.dataTransfer.getData("application/processlab-node");
            if (!type) return;

            const position = screenToFlowPosition({
                x: e.clientX,
                y: e.clientY,
            });

            const newNode = createFlowNode(type, position);
            setNodes((nds: Node[]) => [...nds, newNode]);
        },
        [screenToFlowPosition, setNodes]
    );

    // ─── Parameter update handler ──────────────────────────────
    const onUpdateParameter = useCallback(
        (nodeId: string, paramName: string, value: number) => {
            setNodes((nds: Node[]) => {
                const updatedNodes = nds.map((node: Node) => {
                    if (node.id !== nodeId) return node;
                    const d = node.data as EngineNodeData;
                    return {
                        ...node,
                        data: {
                            ...d,
                            parameters: {
                                ...d.parameters,
                                [paramName]: {
                                    ...(d.parameters?.[paramName] || {}),
                                    value,
                                },
                            },
                        },
                    };
                });

                setEdges((currentEdges: Edge[]) => {
                    setTimeout(
                        () => runRecalculation(updatedNodes, currentEdges),
                        0
                    );
                    return currentEdges;
                });

                const updatedSelected = updatedNodes.find((n) => n.id === nodeId);
                if (updatedSelected) {
                    setSelectedNode(updatedSelected);
                }

                return updatedNodes;
            });
        },
        [setNodes, setEdges, runRecalculation]
    );

    // Sync selectedNode when main nodes array updates
    useEffect(() => {
        if (selectedNode) {
            const updated = nodes.find((n) => n.id === selectedNode.id);
            if (updated && updated !== selectedNode) {
                setSelectedNode(updated);
            }
        }
    }, [nodes, selectedNode]);

    // ─── Loading state ─────────────────────────────────────────
    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading canvas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            <NodePalette onAddNode={addNode} />
            <div className="flex-1 relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={onNodesDelete}
                    deleteKeyCode={["Backspace", "Delete"]}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-background"
                    defaultEdgeOptions={{
                        style: { stroke: "oklch(0.65 0.18 250)", strokeWidth: 2 },
                        animated: true,
                    }}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={24}
                        size={1}
                        color="oklch(0.4 0.05 240 / 0.3)"
                    />
                    <Controls className="!bg-card !border-border !shadow-lg" />
                    <MiniMap
                        className="!bg-card !border-border"
                        nodeColor="oklch(0.65 0.18 250)"
                        maskColor="oklch(0.1 0.02 260 / 0.7)"
                    />
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
