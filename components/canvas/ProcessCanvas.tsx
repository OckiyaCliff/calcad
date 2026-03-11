"use client";

import { useCallback, useRef, useMemo, useState, useEffect } from "react";
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

const nodeTypes = {
    engineNode: EngineNode,
};

let nodeIdCounter = 0;

function createFlowNode(type: string, position: { x: number; y: number }): Node {
    const def = getNodeDefinition(type);
    if (!def) {
        return {
            id: `node_${++nodeIdCounter}`,
            type: "engineNode",
            position,
            data: { nodeType: type, label: type, parameters: {}, inputs: {}, computedOutputs: {} },
        };
    }

    const parameters: Record<string, { value: number; unit: string }> = {};
    for (const p of def.parameters) {
        parameters[p.name] = { value: p.defaultValue, unit: p.unit };
    }

    // For stream nodes, parameters are also outputs
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
        },
    };
}

function ProcessCanvasInner() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    // Recalculate graph when nodes or edges change
    const runRecalculation = useCallback(
        (currentNodes: Node[], currentEdges: Edge[]) => {
            const graphNodes = new Map<string, GraphNode>();
            for (const node of currentNodes) {
                const d = node.data as any;
                const params: Record<string, { value: number }> = {};
                for (const [k, v] of Object.entries(d.parameters || {})) {
                    params[k] = { value: (v as any).value };
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

            setNodes((nds) =>
                nds.map((node) => {
                    const nodeResults = results.get(node.id);
                    const graphNode = graphNodes.get(node.id);
                    if (nodeResults) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                computedOutputs: nodeResults,
                                inputs: graphNode?.inputs || (node.data as any).inputs,
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
            setEdges((eds) => {
                const newEdges = addEdge(
                    {
                        ...connection,
                        style: { stroke: "oklch(0.65 0.18 250)", strokeWidth: 2 },
                        animated: true,
                    },
                    eds
                );
                // Recalculate after edge is added
                setTimeout(() => {
                    setNodes((currentNodes) => {
                        runRecalculation(currentNodes, newEdges);
                        return currentNodes;
                    });
                }, 0);
                return newEdges;
            });
        },
        [setEdges, setNodes, runRecalculation]
    );

    const onNodeClick = useCallback(
        (_: any, node: Node) => {
            setSelectedNode(node);
        },
        []
    );

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const addNode = useCallback(
        (type: string) => {
            const position = { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 };
            const newNode = createFlowNode(type, position);
            setNodes((nds) => [...nds, newNode]);
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
            setNodes((nds) => [...nds, newNode]);
        },
        [screenToFlowPosition, setNodes]
    );

    const onUpdateParameter = useCallback(
        (nodeId: string, paramName: string, value: number) => {
            setNodes((nds) => {
                const updatedNodes = nds.map((node) => {
                    if (node.id !== nodeId) return node;
                    const d = node.data as any;
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

                // Recalculate after parameter update
                setEdges((currentEdges) => {
                    setTimeout(() => runRecalculation(updatedNodes, currentEdges), 0);
                    return currentEdges;
                });

                // Update selected node reference
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
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
}

export function ProcessCanvas() {
    return (
        <ReactFlowProvider>
            <ProcessCanvasInner />
        </ReactFlowProvider>
    );
}
