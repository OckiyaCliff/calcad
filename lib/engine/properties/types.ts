/**
 * calCAd Component & Property Engine Types
 */

export enum Phase {
    Vapor = "vapor",
    Liquid = "liquid",
    Solid = "solid",
    Supercritical = "supercritical",
}

export interface State {
    T: number; // Temperature in Kelvin
    P: number; // Pressure in Pascal
    composition?: Record<string, number>; // mole fractions
    phase?: Phase;
}

export type PropertyModelType = 'constant' | 'polynomial' | 'equation' | 'table';

export interface PropertyModel {
    type: PropertyModelType;
    formula?: string; // For 'equation' (DSL)
    coefficients?: number[]; // For 'polynomial' (A + BT + CT^2...)
    value?: number; // For 'constant'
    validRange?: {
        minT?: number;
        maxT?: number;
        minP?: number;
        maxP?: number;
    };
}

export interface Component {
    id: string;
    name: string;
    formula?: string;
    molarMass: number; // kg/mol
    
    // Critical constants
    Tc?: number; // K
    Pc?: number; // Pa
    omega?: number; // Acentric factor

    // Thermochemical data
    Hf?: number; // Standard enthalpy of formation at 298.15K (J/mol)
    Gf?: number; // Standard Gibbs energy of formation at 298.15K (J/mol)
    
    // Property models
    properties: {
        cp?: PropertyModel;        // Heat capacity (J/mol/K)
        density?: PropertyModel;   // Density (kg/m3 or mol/m3)
        viscosity?: PropertyModel; // Viscosity (Pa-s)
        enthalpy?: PropertyModel;  // Enthalpy (J/mol)
        vaporPressure?: PropertyModel; // Pa
    };
    
    isCustom?: boolean;
    definitionVersion?: string;
}

export interface Mixture {
    components: string[]; // IDs from registry
    composition: Record<string, number>; // mole fractions (sum to 1)
}
