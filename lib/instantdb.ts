import { init, i } from '@instantdb/react';

// InstantDB Schema Definition
const schema = i.schema({
    entities: {
        workspaces: i.entity({
            name: i.string(),
            ownerId: i.string(),
            createdAt: i.number(),
        }),
        projects: i.entity({
            name: i.string(),
            description: i.string(),
            status: i.string(),
            createdAt: i.number(),
            workspaceId: i.string(),
        }),
        nodes: i.entity({
            projectId: i.string(),
            type: i.string(),
            label: i.string(),
            positionX: i.number(),
            positionY: i.number(),
            parameters: i.json(),
            inputs: i.json(),
            outputs: i.json(),
            equations: i.json(),
            fluidId: i.string().optional(),
            mixtureComposition: i.json().optional(),
        }),
        edges: i.entity({
            projectId: i.string(),
            source: i.string(),
            target: i.string(),
            sourceHandle: i.string(),
            targetHandle: i.string(),
        }),
        custom_components: i.entity({
            name: i.string(),
            formula: i.string(),
            molarMass: i.number(),
            properties: i.json(),
            createdAt: i.number(),
        }),
        customNodeDefs: i.entity({
            name: i.string(),
            category: i.string(),
            description: i.string(),
            inputDefs: i.json(),
            parameterDefs: i.json(),
            equationDefs: i.json(),
            outputDefs: i.json(),
            workspaceId: i.string(),
        }),
    },
});

type Schema = typeof schema;

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || '';

export const db = init<Schema>({ appId: APP_ID, schema });
