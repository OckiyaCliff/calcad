import { Component } from "./types";

/**
 * Built-in Component Registry for calCAd
 */

export const BUILTIN_COMPONENTS: Component[] = [
    {
        id: "h2o",
        name: "Water",
        formula: "H2O",
        molarMass: 0.018015,
        Tc: 647.1,
        Pc: 22.06e6,
        omega: 0.344,
        properties: {
            cp: {
                type: 'polynomial',
                coefficients: [75.32, 0, 0], // Simplistic constant liquid Cp for now
                validRange: { minT: 273.15, maxT: 373.15 }
            },
            density: {
                type: 'constant',
                value: 997, // kg/m3
            }
        }
    },
    {
        id: "ch4",
        name: "Methane",
        formula: "CH4",
        molarMass: 0.01604,
        Tc: 190.56,
        Pc: 4.599e6,
        omega: 0.011,
        properties: {
            cp: {
                type: 'polynomial',
                coefficients: [34.31, 1.05e-2, 0], // J/mol/K
            }
        }
    },
    {
        id: "co2",
        name: "Carbon Dioxide",
        formula: "CO2",
        molarMass: 0.04401,
        Tc: 304.13,
        Pc: 7.375e6,
        omega: 0.224,
        properties: {
            cp: {
                type: 'polynomial',
                coefficients: [19.80, 0.073, -0.00003], // J/mol/K
            }
        }
    }
];

class ComponentRegistry {
    private components = new Map<string, Component>();

    constructor() {
        BUILTIN_COMPONENTS.forEach(c => this.components.set(c.id, c));
    }

    getComponent(id: string): Component | undefined {
        return this.components.get(id);
    }

    getAll(): Component[] {
        return Array.from(this.components.values());
    }

    registerCustom(component: Component) {
        this.components.set(component.id, { ...component, isCustom: true });
    }
}

export const registry = new ComponentRegistry();
