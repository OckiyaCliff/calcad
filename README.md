<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_Flow-12-blue?style=for-the-badge" alt="React Flow" />
  <img src="https://img.shields.io/badge/InstantDB-Realtime-green?style=for-the-badge" alt="InstantDB" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

# 📐 calCAd

**The engineering calculation platform for designing process systems, performing calculations, and building custom engineering models — entirely in the browser.**

calCAd is a web-native platform that brings the power of traditional desktop engineering tools into a modern, collaborative, browser-based environment — inspired by tools like Figma and GitHub.

---

## ✨ Features

### 🔬 Process Design Canvas
- Drag-and-drop node-based visual editor powered by React Flow
- 7 built-in unit operation nodes (Stream, Mixer, Pump, Heater, Heat Exchanger, Reactor, Separator)
- Animated stream connections between equipment
- Real-time parameter editing with live output recalculation
- MiniMap, zoom controls, and responsive backdrop grid

### ⚡ Live Calculation Engine
- Equation evaluation using `mathjs` with variable substitution
- Topological sort-based dependency resolution
- Automatic downstream recalculation when upstream parameters change
- **[New]** Unit-aware calculations with SI/Imperial conversion support

### 🧩 Custom Node Builder
- Create your own engineering calculation nodes
- Define custom inputs, parameters, equations, and outputs
- Test equations live before saving
- Custom nodes appear instantly in the canvas palette

### 🔐 Authentication & Workspaces
- Email magic code authentication via InstantDB
- Personal workspaces with project organization
- Project status tracking (Draft, Review, Approved)

### 🎨 Premium Design
- Dark mode engineering aesthetic
- Glassmorphism UI elements
- Animated interactions and smooth transitions
- Responsive layout with collapsible sidebar

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- An [InstantDB](https://instantdb.com) account (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/OckiyaCliff/calcad.git
cd calcad

# Install dependencies
pnpm install
```

### Configuration

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_INSTANT_APP_ID=your-instantdb-app-id
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅
- [x] Authentication
- [x] Workspace + project system
- [x] Process canvas with 7 unit operations
- [x] Live calculation engine
- [x] Custom node builder

### Phase 2 — Core Product ✅
- [x] Canvas state persistence to InstantDB
- [x] Full Calculations summary tab
- [x] CSV/JSON Data Export
- [x] Template library (4 built-in process trains)
- [x] Node/Edge deletion (keys + UI button)

### Phase 3 — Engineering Intelligence ✅
- [x] **Robust Dynamic Unit System**: mathjs-powered dimensional conversion
- [x] **Persistent Custom Nodes**: Store node schemas in InstantDB
- [x] **Iterative Solvers**: Support for recycle streams (Wegstein acceleration)

### Phase 4 — Component & Property Engine ✅
- [x] **Industrial Chemical Registry**: 20+ components with Hf/Gf/Cp(T) data
- [x] **Property Integration**: Automatic injection of Cp and Density into equations

### Phase 5 — Reaction Engineering ✅
- [x] **Stoichiometry Engine**: CH4 + 2O2 -> CO2 + 2H2O parsing
- [x] **Reactor Design**: Conversion-based energy and mass balances

### Phase 4 — Platform
- [ ] Real-time collaboration with presence
- [ ] AI engineering assistant
- [ ] Simulation versioning & state snapshots
- [ ] PDF report generation

---

## 📖 Documentation
Detailed technical specifications of the engine, property models, and solvers can be found in [DOCS.md](./DOCS.md).

---

## 📐 Advanced Case Studies

### Case Study 5: Methane Combustion Energy Balance
**Goal:** Calculate the heat released by burning 10 mol/s of Methane.
1. Open the **Reactions** manager and add `CH4 + 2O2 -> CO2 + 2H2O`.
2. The engine calculates $\Delta Hr = -802.3 \text{ kJ/mol}$ (Exothermic).
3. In the canvas, connect a 10 mol/s Methane stream to a **Conversion Reactor**.
4. Set conversion to 1.0. The duty output shows **-8,023 kW**.

### Case Study 6: Recycle Loop Convergence
**Goal:** Simulate a system with a 20% purge and 80% recycle of unreacted feed.
1. Connect **Mixer** → **Reactor** → **Separator**.
2. Connect the Separator "Bottoms" back to the Mixer "Flow 2".
3. The **Recycle Solver** activates. You will see "Converged (N iter)" in ## 📐 Engineering Case Studies

Experience the power of **calCAd** through these seven practical engineering scenarios.

---

### Case Study 1: Heat Exchanger Duty Calculation
**Goal:** Cool a process stream from 120°C to 60°C.
- **Setup:** Connect a **Stream** (10 kg/s, Cp 4.18) to a **Heat Exchanger**.
- **Result:** Setting `Tout = 60` instantly calculates a duty of **2,508 kW**.

### Case Study 2: Pump Sizing & Power
**Goal:** Increase pressure from 101.3 kPa to 501.3 kPa at 5 kg/s.
- **Setup:** Connect **Stream** to **Pump** (70% efficiency, 1000 kg/m³ density).
- **Result:** Output shows a power requirement of **2.86 kW**.

### Case Study 3: Reactor Yield & Selectivity
**Goal:** Determine product rate for a 50 kg/s feed.
- **Setup:** Connect **Stream** to **Reactor** (85% conversion, 92% selectivity).
- **Result:** **39.10 kg/s** of product and **7.50 kg/s** unreacted feed.

### Case Study 4: Multi-Step Process Train
**Goal:** Simulate a Pump → Heater → Reactor sequence.
- **Setup:** Build the chain on the canvas.
- **Result:** Each node feeds the next; changing the pump pressure rise updates the reactor's inlet state in real-time.

### Case Study 5: Reaction Thermodynamics
**Goal:** Calculate energy release for Methane Combustion (`CH4 + 2O2 -> CO2 + 2H2O`).
- **Setup:** Define the reaction in the **Reaction Manager**. 
- **Result:** The system calculates $\Delta Hr = -802.3 \text{ kJ/mol}$. A 10 mol/s reactor at 100% conversion outputs **8.02 MW** of heat.

### Case Study 6: Recycle Loop Convergence
**Goal:** Simulate a process with a 20% purge and 80% recycle.
- **Setup:** Connect **Mixer → Reactor → Separator**, then loop the Separator bottoms back to the Mixer.
- **Result:** The **Recycle Solver** activates, displaying "Converged" in the toolbar once the system reaches a stable mass balance.

### Case Study 7: Custom Reynolds Number Node
**Goal:** Build a reusable fluid mechanics calculator.
- **Setup:** In the **Node Builder**, define `Re = density * velocity * diameter / viscosity`.
- **Result:** Save the node to your palette and use it across any project in your workspace.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React, TailwindCSS, shadcn/ui |
| **Canvas** | React Flow (xyflow) v12 |
| **Math Engine** | mathjs |
| **Solver** | Wegstein-accelerated Successive Substitution |
| **Database** | InstantDB (Realtime NoSQL) |
| **Language** | TypeScript |

---

## 🗺️ Future Roadmap (The Next Evolution)

### Phase 7 — Thermodynamic Depth
- [ ] **Equation of State (EOS)**: Peng-Robinson implementation for VLE.
- [ ] **Flash Vessels**: Automatic Vapor/Liquid split calculation based on T/P.
- [ ] **Global Unit Persistence**: Multi-project unit preference memory.

### Phase 8 — Automation & Reporting
- [ ] **AI Engineering Assistant**: GPT-4o powered process optimizer.
- [ ] **PDF Reporting**: Instant generation of professional process datasheets.
- [ ] **Real-time Collaboration**: Multi-user cursor presence and live editing.

---

<p align="center">
  <strong>calCAd</strong> — The collaborative engineering workspace for the modern engineer.
</p>
d</strong> — The collaborative engineering workspace for the modern engineer.
</p>