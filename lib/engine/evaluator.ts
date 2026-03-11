import { evaluate, parse } from "mathjs";

export interface EvalContext {
    [variable: string]: number;
}

/**
 * Evaluate a single mathematical equation string with variable substitution.
 * Example: evaluateEquation("flow_rate * Cp * (Tin - Tout)", { flow_rate: 10, Cp: 4.18, Tin: 120, Tout: 60 })
 */
export function evaluateEquation(
    equation: string,
    context: EvalContext
): number | null {
    try {
        const result = evaluate(equation, context);
        if (typeof result === "number" && isFinite(result)) {
            return result;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Parse an equation string like "Q = flow_rate * Cp * (Tin - Tout)"
 * Returns { output: "Q", expression: "flow_rate * Cp * (Tin - Tout)" }
 */
export function parseEquation(equation: string): {
    output: string;
    expression: string;
} | null {
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
 * Evaluate a set of equations in order, building up the context as we go.
 * Returns the full context including computed outputs.
 */
export function evaluateNodeEquations(
    equations: string[],
    initialContext: EvalContext
): EvalContext {
    const context = { ...initialContext };

    for (const eq of equations) {
        const parsed = parseEquation(eq);
        if (!parsed) continue;

        const result = evaluateEquation(parsed.expression, context);
        if (result !== null) {
            context[parsed.output] = result;
        }
    }

    return context;
}
