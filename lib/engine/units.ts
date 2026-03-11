import { unit, Unit } from "mathjs";

/**
 * Convert a value from one unit to another.
 * Uses mathjs built-in unit system.
 */
export function convertUnit(
    value: number,
    fromUnit: string,
    toUnit: string
): number | null {
    try {
        const result = unit(value, fromUnit).to(toUnit);
        return result.toNumber(toUnit);
    } catch {
        return null;
    }
}

/**
 * Format a value with its unit for display.
 */
export function formatWithUnit(value: number, unitStr: string): string {
    if (!unitStr) return value.toFixed(2);
    return `${value.toFixed(2)} ${unitStr}`;
}

/**
 * Common engineering unit categories.
 */
export const unitCategories: Record<string, string[]> = {
    temperature: ["degC", "degF", "K"],
    pressure: ["Pa", "kPa", "MPa", "bar", "atm", "psi"],
    flow_rate_mass: ["kg/s", "kg/h", "lb/s", "lb/h"],
    flow_rate_vol: ["m^3/s", "m^3/h", "L/s", "L/min", "gal/min"],
    energy: ["J", "kJ", "MJ", "BTU", "kWh"],
    power: ["W", "kW", "MW", "hp", "BTU/h"],
    length: ["m", "cm", "mm", "ft", "in"],
    area: ["m^2", "cm^2", "ft^2"],
    density: ["kg/m^3", "g/cm^3", "lb/ft^3"],
    velocity: ["m/s", "ft/s", "km/h"],
    viscosity: ["Pa s", "cP"],
};

/**
 * Get suggested units for a variable name based on common patterns.
 */
export function suggestUnit(variableName: string): string {
    const name = variableName.toLowerCase();
    if (name.includes("temp") || name === "t" || name === "tin" || name === "tout")
        return "degC";
    if (name.includes("pressure") || name === "p" || name === "dp")
        return "kPa";
    if (name.includes("flow") || name === "m" || name === "mdot")
        return "kg/s";
    if (name.includes("power") || name === "w") return "kW";
    if (name.includes("duty") || name === "q") return "kW";
    if (name.includes("area") || name === "a") return "m^2";
    if (name.includes("cp")) return "kJ/(kg degC)";
    return "";
}
