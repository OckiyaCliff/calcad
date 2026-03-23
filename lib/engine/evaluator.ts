import { evaluate, parse, unit } from "mathjs";
import { registry } from "./properties/registry";
import { resolveComponentProperty, resolveMixtureProperty } from "./properties/evaluator";
import { State, Component } from "./properties/types";

export interface EvalContext {
    [variable: string]: number;
}

export interface UnitMapping {
    [variable: string]: string;
}

/**
 * Parse an equation string like "Q = flow_rate * Cp * (Tin - Tout)"
 * Returns { output: "Q", expression: "flow_rate * Cp * (Tin - Tout)" }
 */
export function parseEquation(equation: string): {
    output: string;
    expression: string;
} | null {
    if (!equation || !equation.includes("=")) return null;
    const parts = equation.split("=").map((s) => s.trim());
    if (parts.length !== 2) return null;
    return { output: parts[0], expression: parts[1] };
}

/**
 * Extract variable names referenced in an equation expression.
 */
export function extractVariables(expression: string): string[] {
    try {
        const node = parse(expression);
        const vars: Set<string> = new Set();
        node.traverse((n: any) => {
            if (n.type === "SymbolNode") {
                vars.add(n.name);
            }
        });
        return Array.from(vars);
    } catch {
        return [];
    }
}

/**
 * Handles unit-aware evaluation of node equations.
 * normalizes inputs/parameters from their current units into the calculation space,
 * evaluates, and then ensures outputs are mapped back to their defined units.
 */
export function evaluateNodeEquations(
    equations: string[],
    initialContext: EvalContext,
    variableUnits: UnitMapping = {},
    fluidId?: string,
    composition?: Record<string, number>
): EvalContext {
    const context = { ...initialContext };
    
    // 1. Prepare unit-aware context using mathjs
    const mathContext: Record<string, any> = {};
    for (const [key, val] of Object.entries(context)) {
        const unitStr = variableUnits[key];
        if (unitStr) {
            try {
                mathContext[key] = unit(val, unitStr);
            } catch (err) {
                console.warn(`Could not create unit for ${key} with unit ${unitStr}:`, err);
                mathContext[key] = val;
            }
        } else {
            mathContext[key] = val;
        }
    }

    // 1b. Inject dynamic properties if a fluid is specified
    if (fluidId) {
        // Determine state (convert T/P to Kelvin/Pascal for the engine)
        // We look for common variable names for T and P
        const T_val = context["temperature"] || context["Tin"] || context["T"] || 298.15;
        const P_val = context["pressure"] || context["Pin"] || context["P"] || 101325;
        const state: State = { T: T_val, P: P_val };

        if (composition && Object.keys(composition).length > 0) {
            // MIXTURE CASE
            const componentIds = Object.keys(composition);
            const components = componentIds.map(id => registry.getComponent(id)).filter(c => !!c) as Component[];
            
            const props: (keyof Component['properties'])[] = ["cp", "density", "viscosity", "enthalpy", "vaporPressure"];
            props.forEach(p => {
                const val = resolveMixtureProperty(components, composition, p, state);
                if (val !== 0) mathContext[`_${String(p)}`] = val;
            });
        } else {
            // SINGLE COMPONENT CASE
            const component = registry.getComponent(fluidId);
            if (component) {
                const props: (keyof Component['properties'])[] = ["cp", "density", "viscosity", "enthalpy", "vaporPressure"];
                props.forEach(p => {
                    const val = resolveComponentProperty(component, p, state);
                    if (val !== 0) {
                        mathContext[`_${String(p)}`] = val;
                    }
                });
                
                mathContext["_mw"] = component.molarMass;
                mathContext["_Tc"] = component.Tc;
                mathContext["_Pc"] = component.Pc;
            }
        }
    }

    // 2. Evaluate equations sequentially
    for (const eq of equations) {
        const parsed = parseEquation(eq);
        if (!parsed) continue;

        try {
            const result = evaluate(parsed.expression, mathContext);
            mathContext[parsed.output] = result;
            
            // Sync back to numeric context
            if (typeof result === "object" && result && "value" in result) {
                // If it's a unit, convert it to the specific unit defined for this output (if any)
                const targetUnit = variableUnits[parsed.output] || result.formatUnits();
                context[parsed.output] = result.toNumber(targetUnit);
            } else if (typeof result === "number") {
                context[parsed.output] = result;
            }
        } catch (err) {
            console.error(`Evaluation error for "${eq}":`, err);
        }
    }

    // 3. Final synchronization pass
    for (const key of Object.keys(mathContext)) {
        const val = mathContext[key];
        if (typeof val === "object" && val && "value" in val) {
            const targetUnit = variableUnits[key] || val.formatUnits();
            context[key] = val.toNumber(targetUnit);
        } else if (typeof val === "number") {
            context[key] = val;
        }
    }

    return context;
}
