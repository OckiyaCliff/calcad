/**
 * calCAd Reaction Engineering Types
 */

/** A single species in a reaction with its stoichiometric coefficient */
export interface ReactionSpecies {
    componentId: string;   // Reference to registry component ID
    formula: string;       // e.g. "CH4", "CO2"
    coefficient: number;   // Stoichiometric coefficient (always positive)
}

/** A parsed, balanced chemical reaction */
export interface Reaction {
    id: string;
    name: string;
    /** Raw equation string, e.g. "CH4 + 2O2 -> CO2 + 2H2O" */
    equationString: string;
    reactants: ReactionSpecies[];
    products: ReactionSpecies[];
    /** Standard heat of reaction at 298.15K (J/mol of limiting reactant) */
    deltaHr?: number;
    /** Standard Gibbs energy of reaction at 298.15K (J/mol) */
    deltaGr?: number;
    /** Is reversible? */
    reversible: boolean;
    /** Reference component for conversion calculations (usually limiting reactant) */
    referenceComponentId?: string;
    /** Phase of reaction */
    phase?: 'gas' | 'liquid' | 'mixed';
}

/** Reactor operating parameters */
export interface ReactorConfig {
    reactionId: string;
    /** Fractional conversion of the reference component (0 to 1) */
    conversion: number;
    /** Operating temperature (K) */
    temperature: number;
    /** Operating pressure (Pa) */
    pressure: number;
    /** Reactor type */
    type: 'conversion' | 'equilibrium' | 'kinetic';
}

/**
 * Result of a reactor calculation
 */
export interface ReactorResult {
    /** Outlet molar flows (mol/s) keyed by component ID */
    outletFlows: Record<string, number>;
    /** Heat duty (J/s = W) - positive = endothermic, negative = exothermic */
    heatDuty: number;
    /** Achieved conversion */
    conversion: number;
    /** Extent of reaction (mol/s) */
    extentOfReaction: number;
}
