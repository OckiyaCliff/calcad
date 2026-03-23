# 📚 calCAd Technical Documentation

This document provides a deep dive into the engineering principles and calculation engine architecture of **calCAd**.

## 🏗️ Core Architecture

calCAd uses a **Reactive Graph Engine** to maintain process simulation consistency.

1.  **Topological Dependency**: Nodes are ordered using Kahn's algorithm. When a parameter changes, downstream nodes are recalculated in sequence.
2.  **Iterative Solver (Recycles)**: If a cycle is detected (e.g., a recycle stream), calCAd switches to a **Successive Substitution** solver with **Wegstein Acceleration** to reach convergence on the mass and energy balance.

---

## 🔬 Property Engine

The property engine (`lib/engine/properties/`) manages thermophysical data for over 20 industrial chemicals.

### Thermochemical Data
- **Standard Enthalpy of Formation (Hf)**: Used for calculating standard Heat of Reaction ($\Delta Hr^\circ$).
- **Heat Capacity (Cp)**: Modeled using the polynomial $Cp = a + bT + cT^2 + dT^3$, where $T$ is in Kelvin.
- **Mixture Rules**: Currently uses **Ideal Mixing Rules** for molar mass, density, and enthalpy.

### Dynamic Resolution
Nodes like `Heater` and `Pump` do not use fixed properties. They dynamically inject `Cp` and `density` into their equations based on the fluid selected in the connected components.

---

## ⚗️ Reaction Engineering

### Stoichiometry Parser
The system parses strings like `CH4 + 2O2 -> CO2 + 2H2O`. 
1.  **Atom Balance**: Automatically verifies that Carbon, Hydrogen, and Oxygen atoms are balanced on both sides.
2.  **Thermo Integration**: Pulls $Hf$ values from the registry to compute the reaction's total heat duty.

### Conversion Reactor
The Reactor node solves:
- $F_{out} = F_{in} \cdot (1 - X)$ (for limiting reactant)
- $Q = \xi \cdot \Delta Hr$ (Reaction duty)

---

## 🔄 Recycle Loops

Recycle loops are handled by the **Recycle Solver** (`lib/engine/recycle-solver.ts`).
- **Tear Streams**: The engine identifies "back-edges" using DFS.
- **Convergence**: Iterates until the fractional change in mass flow across all tear streams is $< 10^{-4}$.
- **Status**: The UI displays a pulse indicator in the toolbar during active solving.

---

## 🛠️ Custom Node Builder

The Node Builder allows you to extend the platform using a sandboxed **mathjs** environment.
- **Context Injection**: Inputs and parameters are provided as variables.
- **Unit Safety**: Equations are unit-aware if output units are specified.
- **Persistence**: Definitions are stored as JSON schemas in **InstantDB**, ensuring they survive tab refreshes.
