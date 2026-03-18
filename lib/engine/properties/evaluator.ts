import { evaluate } from "mathjs";
import { Component, State, PropertyModel, PropertyModelType } from "./types";

/**
 * Resolves a specific physical property for a component at a given state.
 */
export function resolveComponentProperty(
    component: Component,
    propertyName: keyof Component['properties'],
    state: State
): number {
    const model = component.properties[propertyName];
    if (!model) return 0;

    return evaluatePropertyModel(model, state);
}

function evaluatePropertyModel(model: PropertyModel, state: State): number {
    const { T, P } = state;

    switch (model.type) {
        case 'constant':
            return model.value || 0;
        
        case 'polynomial':
            if (!model.coefficients) return 0;
            // A + BT + CT^2 + DT^3...
            return model.coefficients.reduce((acc, coeff, i) => acc + coeff * Math.pow(T, i), 0);
        
        case 'equation':
            if (!model.formula) return 0;
            try {
                // Use mathjs directly for pure expressions
                return evaluate(model.formula, { T, P });
            } catch (err) {
                console.error(`Error evaluating custom property formula "${model.formula}":`, err);
                return 0;
            }
        
        case 'table':
            // TODO: Implement interpolation for table data
            return 0;
            
        default:
            return 0;
    }
}

/**
 * Property Engine API for Mixture Evaluations
 */
export function resolveMixtureProperty(
    components: Component[],
    fractions: Record<string, number>,
    propertyName: keyof Component['properties'],
    state: State
): number {
    // Basic Ideal Mixing Rule: Sum(xi * Pi)
    let total = 0;
    for (const comp of components) {
        const xi = fractions[comp.id] || 0;
        if (xi === 0) continue;
        
        const Pi = resolveComponentProperty(comp, propertyName, state);
        total += xi * Pi;
    }
    return total;
}
