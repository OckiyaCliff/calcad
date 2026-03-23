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
        Tc: 647.1, Pc: 22.06e6, omega: 0.344,
        Hf: -285830, // J/mol (liquid)
        Gf: -237130,
        properties: {
            cp: { type: 'polynomial', coefficients: [75.32, 0, 0], validRange: { minT: 273.15, maxT: 373.15 } },
            density: { type: 'constant', value: 997 }
        }
    },
    {
        id: "ch4",
        name: "Methane",
        formula: "CH4",
        molarMass: 0.01604,
        Tc: 190.56, Pc: 4.599e6, omega: 0.011,
        Hf: -74870, // J/mol (gas)
        Gf: -50720,
        properties: { cp: { type: 'polynomial', coefficients: [34.31, 0.0105, 0] } }
    },
    {
        id: "c2h6",
        name: "Ethane",
        formula: "C2H6",
        molarMass: 0.03007,
        Tc: 305.32, Pc: 4.872e6, omega: 0.099,
        Hf: -83800,
        Gf: -31900,
        properties: { cp: { type: 'polynomial', coefficients: [5.409, 0.178, -0.000069] } }
    },
    {
        id: "c3h8",
        name: "Propane",
        formula: "C3H8",
        molarMass: 0.04409,
        Tc: 369.83, Pc: 4.248e6, omega: 0.152,
        Hf: -104700,
        Gf: -24400,
        properties: { cp: { type: 'polynomial', coefficients: [-4.22, 0.306, -0.00016] } }
    },
    {
        id: "n-c4h10",
        name: "n-Butane",
        formula: "C4H10",
        molarMass: 0.05812,
        Tc: 425.12, Pc: 3.796e6, omega: 0.200,
        Hf: -125600,
        Gf: -16600,
        properties: { cp: { type: 'polynomial', coefficients: [9.487, 0.331, -0.00011] } }
    },
    {
        id: "n-c5h12",
        name: "n-Pentane",
        formula: "C5H12",
        molarMass: 0.07215,
        Tc: 469.7, Pc: 3.37e6, omega: 0.252,
        Hf: -146400,
        Gf: -8200,
        properties: { cp: { type: 'polynomial', coefficients: [13.4, 0.407, -0.00014] } }
    },
    {
        id: "o2",
        name: "Oxygen",
        formula: "O2",
        molarMass: 0.03199,
        Tc: 154.58, Pc: 5.043e6, omega: 0.022,
        Hf: 0,    // Element in standard state
        Gf: 0,
        properties: { cp: { type: 'polynomial', coefficients: [29.1, 0.0115, -0.000006] } }
    },
    {
        id: "n2",
        name: "Nitrogen",
        formula: "N2",
        molarMass: 0.02801,
        Tc: 126.2, Pc: 3.39e6, omega: 0.037,
        Hf: 0,
        Gf: 0,
        properties: { cp: { type: 'polynomial', coefficients: [29.1, -0.0035, 0.00001] } }
    },
    {
        id: "h2",
        name: "Hydrogen",
        formula: "H2",
        molarMass: 0.002016,
        Tc: 33.19, Pc: 1.313e6, omega: -0.216,
        Hf: 0,
        Gf: 0,
        properties: { cp: { type: 'polynomial', coefficients: [27.14, 0.009, -0.000001] } }
    },
    {
        id: "co2",
        name: "Carbon Dioxide",
        formula: "CO2",
        molarMass: 0.04401,
        Tc: 304.13, Pc: 7.375e6, omega: 0.224,
        Hf: -393510,
        Gf: -394360,
        properties: { cp: { type: 'polynomial', coefficients: [19.8, 0.073, -0.00003] } }
    },
    {
        id: "co",
        name: "Carbon Monoxide",
        formula: "CO",
        molarMass: 0.02801,
        Tc: 132.9, Pc: 3.499e6, omega: 0.045,
        Hf: -110530,
        Gf: -137170,
        properties: { cp: { type: 'polynomial', coefficients: [29.1, 0.0042, 0] } }
    },
    {
        id: "nh3",
        name: "Ammonia",
        formula: "NH3",
        molarMass: 0.01703,
        Tc: 405.4, Pc: 11.33e6, omega: 0.256,
        Hf: -45900,
        Gf: -16400,
        properties: { cp: { type: 'polynomial', coefficients: [27.3, 0.023, 0.000017] } }
    },
    {
        id: "h2s",
        name: "Hydrogen Sulfide",
        formula: "H2S",
        molarMass: 0.03408,
        Tc: 373.2, Pc: 8.94e6, omega: 0.094,
        Hf: -20600,
        Gf: -33400,
        properties: { cp: { type: 'polynomial', coefficients: [26.9, 0.019, 0] } }
    },
    {
        id: "so2",
        name: "Sulfur Dioxide",
        formula: "SO2",
        molarMass: 0.06406,
        Tc: 430.8, Pc: 7.884e6, omega: 0.245,
        Hf: -296830,
        Gf: -300190,
        properties: { cp: { type: 'polynomial', coefficients: [38.9, 0.0039, 0] } }
    },
    {
        id: "meoh",
        name: "Methanol",
        formula: "CH3OH",
        molarMass: 0.03204,
        Tc: 512.6, Pc: 8.09e6, omega: 0.566,
        Hf: -201000, // gas phase
        Gf: -162000,
        properties: { cp: { type: 'polynomial', coefficients: [21.1, 0.07, 0.00002] } }
    },
    {
        id: "etoh",
        name: "Ethanol",
        formula: "C2H5OH",
        molarMass: 0.04607,
        Tc: 513.9, Pc: 6.14e6, omega: 0.645,
        Hf: -234800,
        Gf: -167900,
        properties: { cp: { type: 'polynomial', coefficients: [23.1, 0.15, 0.0001] } }
    },
    {
        id: "c2h4",
        name: "Ethylene",
        formula: "C2H4",
        molarMass: 0.02805,
        Tc: 282.34, Pc: 5.041e6, omega: 0.087,
        Hf: 52470,
        Gf: 68460,
        properties: { cp: { type: 'polynomial', coefficients: [3.95, 0.156, -0.000083] } }
    },
    {
        id: "c3h6",
        name: "Propylene",
        formula: "C3H6",
        molarMass: 0.04208,
        Tc: 364.85, Pc: 4.6e6, omega: 0.140,
        Hf: 20410,
        Gf: 62720,
        properties: { cp: { type: 'polynomial', coefficients: [3.15, 0.235, -0.00012] } }
    },
    {
        id: "c6h6",
        name: "Benzene",
        formula: "C6H6",
        molarMass: 0.07811,
        Tc: 562.05, Pc: 4.895e6, omega: 0.210,
        Hf: 82930,  // gas
        Gf: 129660,
        properties: { cp: { type: 'polynomial', coefficients: [-33.9, 0.474, -0.000301] } }
    },
    {
        id: "c7h8",
        name: "Toluene",
        formula: "C7H8",
        molarMass: 0.09214,
        Tc: 591.75, Pc: 4.108e6, omega: 0.264,
        Hf: 50170,
        Gf: 122100,
        properties: { cp: { type: 'polynomial', coefficients: [-34.2, 0.565, -0.000341] } }
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

    registerMany(components: Component[]) {
        components.forEach(c => this.components.set(c.id, c));
    }

    clearCustom() {
        // Keep only built-ins
        const builtInIds = BUILTIN_COMPONENTS.map(c => c.id);
        for (const id of this.components.keys()) {
            if (!builtInIds.includes(id)) {
                this.components.delete(id);
            }
        }
    }
}

export const registry = new ComponentRegistry();
