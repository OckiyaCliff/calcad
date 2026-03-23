/**
 * calCAd Stoichiometry Parser
 * 
 * Parses chemical reaction strings into structured Reaction objects.
 * Supports formats like:
 *   "CH4 + 2O2 -> CO2 + 2H2O"
 *   "N2 + 3H2 <-> 2NH3"
 *   "2C2H6 + 7O2 -> 4CO2 + 6H2O"
 */

import { Reaction, ReactionSpecies } from "./types";
import { registry } from "../properties/registry";

/**
 * Parse a single species string like "2H2O" or "CH4" into coefficient + formula.
 */
function parseSpeciesToken(token: string): { coefficient: number; formula: string } {
    const trimmed = token.trim();
    if (!trimmed) return { coefficient: 1, formula: "" };

    // Match optional leading integer/decimal coefficient followed by formula
    const match = trimmed.match(/^(\d+\.?\d*)\s*([A-Z].*)$/);
    if (match) {
        return {
            coefficient: parseFloat(match[1]),
            formula: match[2].trim(),
        };
    }
    // No coefficient — default to 1
    return { coefficient: 1, formula: trimmed };
}

/**
 * Try to find a component in the registry by formula match.
 * Falls back to using the formula as the ID if no match is found.
 */
function resolveComponentId(formula: string): string {
    const allComponents = registry.getAll();
    const match = allComponents.find(
        (c) => c.formula?.toLowerCase() === formula.toLowerCase()
    );
    return match ? match.id : formula.toLowerCase();
}

/**
 * Parse a side of a reaction (reactants or products).
 */
function parseSide(sideStr: string): ReactionSpecies[] {
    const tokens = sideStr.split("+").map((t) => t.trim()).filter(Boolean);
    return tokens.map((token) => {
        const { coefficient, formula } = parseSpeciesToken(token);
        return {
            componentId: resolveComponentId(formula),
            formula,
            coefficient,
        };
    });
}

/**
 * Parse a full reaction string into a Reaction object.
 * 
 * @param equationString e.g. "CH4 + 2O2 -> CO2 + 2H2O"
 * @param name Optional human-readable name
 * @param id Optional unique identifier
 * @returns Parsed Reaction object, or null if parsing fails
 */
export function parseReaction(
    equationString: string,
    name?: string,
    id?: string
): Reaction | null {
    if (!equationString) return null;

    // Detect reversibility
    let reversible = false;
    let separator = "->";

    if (equationString.includes("<->") || equationString.includes("⇌")) {
        reversible = true;
        separator = equationString.includes("<->") ? "<->" : "⇌";
    } else if (equationString.includes("→")) {
        separator = "→";
    } else if (equationString.includes("=>")) {
        separator = "=>";
    } else if (!equationString.includes("->")) {
        return null; // No valid separator found
    }

    const sides = equationString.split(separator);
    if (sides.length !== 2) return null;

    const reactants = parseSide(sides[0]);
    const products = parseSide(sides[1]);

    if (reactants.length === 0 || products.length === 0) return null;

    return {
        id: id || `rxn_${Date.now()}`,
        name: name || equationString.trim(),
        equationString: equationString.trim(),
        reactants,
        products,
        reversible,
        referenceComponentId: reactants[0].componentId,
    };
}

/**
 * Calculate the standard heat of reaction (ΔHr°) from enthalpies of formation.
 * ΔHr° = Σ(νi · Hf,products) - Σ(νi · Hf,reactants)
 * 
 * @returns Heat of reaction in J/mol, or null if Hf data is unavailable
 */
export function calculateHeatOfReaction(reaction: Reaction): number | null {
    let sumProducts = 0;
    let sumReactants = 0;

    for (const species of reaction.products) {
        const component = registry.getComponent(species.componentId);
        if (!component || component.Hf === undefined) return null;
        sumProducts += species.coefficient * component.Hf;
    }

    for (const species of reaction.reactants) {
        const component = registry.getComponent(species.componentId);
        if (!component || component.Hf === undefined) return null;
        sumReactants += species.coefficient * component.Hf;
    }

    return sumProducts - sumReactants;
}

/**
 * Validate that a reaction is mass-balanced by checking atom counts.
 * Returns true if balanced, false otherwise.
 * 
 * Note: This is a simplified check that counts common atoms.
 */
export function isBalanced(reaction: Reaction): boolean {
    const countAtoms = (species: ReactionSpecies[]): Record<string, number> => {
        const atoms: Record<string, number> = {};
        for (const s of species) {
            // Simple atom parser: matches letter(s) followed by optional number
            const atomMatches = s.formula.matchAll(/([A-Z][a-z]?)(\d*)/g);
            for (const m of atomMatches) {
                if (!m[1]) continue;
                const atom = m[1];
                const count = parseInt(m[2] || "1", 10);
                atoms[atom] = (atoms[atom] || 0) + s.coefficient * count;
            }
        }
        return atoms;
    };

    const reactantAtoms = countAtoms(reaction.reactants);
    const productAtoms = countAtoms(reaction.products);

    const allAtoms = new Set([...Object.keys(reactantAtoms), ...Object.keys(productAtoms)]);
    for (const atom of allAtoms) {
        if (Math.abs((reactantAtoms[atom] || 0) - (productAtoms[atom] || 0)) > 0.001) {
            return false;
        }
    }
    return true;
}
