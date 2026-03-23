/**
 * calCAd Reactor Calculator
 * 
 * Solves conversion-based reactor mass and energy balances.
 */

import { Reaction, ReactorConfig, ReactorResult } from "./types";
import { calculateHeatOfReaction } from "./parser";

/**
 * Calculate the outlet flows and heat duty for a conversion reactor.
 * 
 * Given inlet molar flows and a reaction with a specified conversion,
 * this function computes the outlet composition and energy balance.
 * 
 * @param reaction The chemical reaction
 * @param inletFlows Molar flow rates of each component (mol/s), keyed by componentId
 * @param conversion Fractional conversion of the reference component (0 to 1)
 * @returns ReactorResult with outlet flows, heat duty, and extent of reaction
 */
export function calculateConversionReactor(
    reaction: Reaction,
    inletFlows: Record<string, number>,
    conversion: number
): ReactorResult {
    // Clamp conversion
    const X = Math.max(0, Math.min(1, conversion));
    
    // Determine the reference component (limiting reactant)
    const refId = reaction.referenceComponentId || reaction.reactants[0].componentId;
    const refSpecies = reaction.reactants.find(r => r.componentId === refId);
    if (!refSpecies) {
        return {
            outletFlows: { ...inletFlows },
            heatDuty: 0,
            conversion: 0,
            extentOfReaction: 0,
        };
    }

    // Inlet molar flow of the reference component
    const F_ref_in = inletFlows[refId] || 0;
    
    // Extent of reaction (mol/s) = F_ref_in * X / ν_ref
    const extent = (F_ref_in * X) / refSpecies.coefficient;

    // Calculate outlet flows
    const outletFlows: Record<string, number> = { ...inletFlows };

    // Reactants are consumed
    for (const reactant of reaction.reactants) {
        const consumed = reactant.coefficient * extent;
        outletFlows[reactant.componentId] = Math.max(
            0,
            (outletFlows[reactant.componentId] || 0) - consumed
        );
    }

    // Products are generated
    for (const product of reaction.products) {
        const generated = product.coefficient * extent;
        outletFlows[product.componentId] = (outletFlows[product.componentId] || 0) + generated;
    }

    // Calculate heat duty from standard heat of reaction
    const deltaHr = calculateHeatOfReaction(reaction);
    // Q = ξ * ΔHr (positive = endothermic, negative = exothermic)
    const heatDuty = deltaHr !== null ? extent * deltaHr : 0;

    return {
        outletFlows,
        heatDuty,
        conversion: X,
        extentOfReaction: extent,
    };
}

/**
 * Format outlet flows as a human-readable summary string.
 */
export function formatReactorSummary(result: ReactorResult): string {
    const lines: string[] = [];
    lines.push(`Conversion: ${(result.conversion * 100).toFixed(1)}%`);
    lines.push(`Extent: ${result.extentOfReaction.toFixed(4)} mol/s`);
    lines.push(`Heat Duty: ${(result.heatDuty / 1000).toFixed(2)} kW`);
    lines.push(`--- Outlet Flows ---`);
    for (const [id, flow] of Object.entries(result.outletFlows)) {
        if (flow > 1e-10) {
            lines.push(`  ${id}: ${flow.toFixed(4)} mol/s`);
        }
    }
    return lines.join("\n");
}
