export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: 'draft' | 'review' | 'approved';
  createdAt: number;
};

export type NodePort = {
  id: string;
  name: string;
  type: 'input' | 'output';
  unit?: string;
  value?: number;
};

export type NodeParameter = {
  name: string;
  value: number;
  unit: string;
  label: string;
};

export type EngineNode = {
  id: string;
  projectId: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  parameters: Record<string, NodeParameter>;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  equations: string[];
};

export type Edge = {
  id: string;
  projectId: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type CustomNodeDef = {
  id: string;
  name: string;
  category: string;
  description?: string;
  inputDefs: any[];
  parameterDefs: any[];
  equationDefs: string[];
  outputDefs: any[];
  workspaceId: string;
};
