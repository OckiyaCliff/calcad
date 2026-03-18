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
 * Common engineering unit categories and their compatible units.
 */
export const unitRegistry: Record<string, { label: string; units: string[]; base: string }> = {
    temperature: {
        label: "Temperature",
        units: ["degC", "degF", "K", "degR"],
        base: "K",
    },
    pressure: {
        label: "Pressure",
        units: ["Pa", "kPa", "MPa", "bar", "atm", "psi"],
        base: "Pa",
    },
    mass_flow: {
        label: "Mass Flow",
        units: ["kg/s", "kg/h", "lb/s", "lb/h", "g/min"],
        base: "kg/s",
    },
    volume_flow: {
        label: "Volume Flow",
        units: ["m^3/s", "m^3/h", "L/s", "L/min", "gal/min", "ft^3/min"],
        base: "m^3/s",
    },
    energy: {
        label: "Energy / Heat",
        units: ["J", "kJ", "MJ", "BTU", "kWh", "cal"],
        base: "J",
    },
    power: {
        label: "Power / Duty",
        units: ["W", "kW", "MW", "hp", "BTU/h"],
        base: "W",
    },
    length: {
        label: "Length / Diameter",
        units: ["m", "cm", "mm", "ft", "in"],
        base: "m",
    },
    area: {
        label: "Area",
        units: ["m^2", "cm^2", "ft^2", "in^2"],
        base: "m^2",
    },
    density: {
        label: "Density",
        units: ["kg/m^3", "g/cm^3", "lb/ft^3"],
        base: "kg/m^3",
    },
    velocity: {
        label: "Velocity",
        units: ["m/s", "ft/s", "km/h", "mph"],
        base: "m/s",
    },
    viscosity: {
        label: "Viscosity",
        units: ["Pa s", "cP", "mPa s"],
        base: "Pa s",
    },
    dimensionless: {
        label: "Dimensionless",
        units: ["", "frac", "%"],
        base: "",
    },
};

/**
 * Find which category a unit belongs to.
 */
export function getUnitCategory(unitStr: string): string | null {
    for (const [category, data] of Object.entries(unitRegistry)) {
        if (data.units.includes(unitStr)) return category;
    }
    return null;
}

/**
 * Get all compatible units for a given unit.
 */
export function getCompatibleUnits(unitStr: string): string[] {
    const category = getUnitCategory(unitStr);
    if (!category) return [unitStr];
    return unitRegistry[category].units;
}

/**
 * Suggest a unit and category based on variable name.
 */
export function suggestUnitAndCategory(variableName: string): { unit: string; category: string } {
    const name = variableName.toLowerCase();
    
    if (name.includes("temp") || name === "t" || name === "tin" || name === "tout" || name === "th_in" || name === "th_out" || name === "tc_in" || name === "tc_out")
        return { unit: "degC", category: "temperature" };
    
    if (name.includes("pressure") || name === "p" || name === "dp" || name === "p_in" || name === "p_out")
        return { unit: "kPa", category: "pressure" };
    
    if (name.includes("flow") || name === "m" || name === "mdot" || name === "feed_rate" || name === "product_rate")
        return { unit: "kg/s", category: "mass_flow" };
    
    if (name.includes("power") || name === "w" || name === "work") 
        return { unit: "kW", category: "power" };
    
    if (name.includes("duty") || name === "q" || name === "heat") 
        return { unit: "kW", category: "power" };
    
    if (name.includes("area") || name === "a") 
        return { unit: "m^2", category: "area" };

    if (name.includes("density") || name === "rho")
        return { unit: "kg/m^3", category: "density" };

    if (name.includes("velocity") || name === "v")
        return { unit: "m/s", category: "velocity" };

    if (name.includes("cp") || name.includes("heat_capacity"))
        return { unit: "kJ/(kg K)", category: "dimensionless" }; // Complex units handled as dimensionless for simplicity in dropdowns for now

    return { unit: "", category: "dimensionless" };
}
