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
        const T_val = context["temperature"] || context["Tin"] || context["T"] || 298.15;
        const P_val = context["pressure"] || context["Pin"] || context["P"] || 101325;
        const state: State = { T: T_val, P: P_val };

        // Property name → equation variable name mapping
        const propMapping: Record<string, string> = {
            cp: "Cp",
            density: "density",
            viscosity: "viscosity",
        };

        if (composition && Object.keys(composition).length > 0) {
            const componentIds = Object.keys(composition);
            const components = componentIds.map(id => registry.getComponent(id)).filter(c => !!c) as Component[];
            
            for (const [prop, varName] of Object.entries(propMapping)) {
                const val = resolveMixtureProperty(components, composition, prop as keyof Component['properties'], state);
                if (val !== 0) {
                    mathContext[varName] = val;
                    mathContext[`_${prop}`] = val;
                }
            }
        } else {
            const component = registry.getComponent(fluidId);
            if (component) {
                for (const [prop, varName] of Object.entries(propMapping)) {
                    const val = resolveComponentProperty(component, prop as keyof Component['properties'], state);
                    if (val !== 0) {
                        mathContext[varName] = val;
                        mathContext[`_${prop}`] = val;
                    }
                }
                
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

        // Pre-check: ensure all referenced variables exist in context
        const referencedVars = extractVariables(parsed.expression);
        let canEvaluate = true;
        for (const v of referencedVars) {
            if (mathContext[v] === undefined) {
                mathContext[v] = 0; // Default missing inputs to 0
            }
        }

        try {
            const result = evaluate(parsed.expression, mathContext);
            mathContext[parsed.output] = result;
            
            if (typeof result === "object" && result && "value" in result) {
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
