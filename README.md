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

### Phase 3 — Engineering Intelligence 🏗️
- [ ] **Robust Dynamic Unit System**: mathjs-powered dimensional conversion
- [ ] **Persistent Custom Nodes**: Store node schemas in InstantDB
- [ ] **Iterative Solvers**: Support for recycle streams (Newton-Raphson)
- [ ] **Global Unit Preferences**: Project-wide SI vs Imperial toggle

### Phase 4 — Platform
- [ ] Real-time collaboration with presence
- [ ] AI engineering assistant
- [ ] Simulation versioning & state snapshots
- [ ] PDF report generation

---

## 📐 5 Practical Case Studies

Below are five real engineering problems you can solve using **calCAd** right now.

---

### Case Study 1: Heat Exchanger Duty Calculation

**Problem:** A chemical plant needs to cool a process stream from 120°C to 60°C. The stream flows at 10 kg/s with a heat capacity (Cp) of 4.18 kJ/(kg·°C). What is the heat duty?

**How to solve in calCAd:**
1. Open a project and go to the **Process Canvas**
2. Drag a **Stream** node onto the canvas
3. Set parameters: `Temperature = 120`, `Flow Rate = 10`, `Cp = 4.18`
4. Drag a **Heat Exchanger** node and connect the Stream output to its input
5. Set the Heat Exchanger `Outlet Temp = 60`
6. The properties panel instantly shows: **Q = 2,508 kW**

---

### Case Study 2: Pump Sizing for a Pipeline

**Problem:** A water transfer pump needs to increase pressure from 101.3 kPa to 501.3 kPa at a flow rate of 5 kg/s. The pump efficiency is 70%. What power is required?

**How to solve in calCAd:**
1. Drag a **Stream** node → set `Flow Rate = 5`, `Pressure = 101.3`
2. Connect it to a **Pump** node
3. Set Pump parameters: `Pressure Rise (dP) = 400`, `Efficiency = 0.70`, `Density = 1000`
4. The output shows: **W = 2.86 kW**

---

### Case Study 3: Reactor Conversion & Product Yield

**Problem:** A reactor receives 50 kg/s of feed. The expected conversion is 85% and selectivity is 92%. What is the product rate and how much feed remains unreacted?

**How to solve in calCAd:**
1. Drag a **Stream** node → set `Flow Rate = 50`
2. Connect to a **Reactor** node
3. Set `Conversion = 0.85`, `Selectivity = 0.92`
4. Outputs update instantly:
   - **Product Rate = 39.10 kg/s**
   - **Unreacted = 7.50 kg/s**

---

### Case Study 4: Multi-Equipment Process Flow

**Problem:** Design a complete process: pump raw feed, heat it, then react it. The feed enters at 25°C, 101.3 kPa, at 8 kg/s.

**How to solve in calCAd:**
1. Place a **Stream** node: `Temp = 25`, `Pressure = 101.3`, `Flow Rate = 8`, `Cp = 4.18`
2. Connect to a **Pump**: `dP = 300`, `Efficiency = 0.75`, `Density = 950`
3. Connect to a **Heater**: `Tout = 150`
4. Connect to a **Reactor**: `Conversion = 0.90`, `Selectivity = 0.95`
5. The entire chain recalculates automatically.

---

### Case Study 5: Custom Node — Reynolds Number Calculator

**Problem:** Build a reusable calculator for Reynolds numbers (`Re = density * velocity * diameter / viscosity`).

**How to solve in calCAd:**
1. Navigate to the **Node Builder** tab
2. Create a new node with inputs for `velocity`, `diameter`, `density`, and `viscosity`
3. Define the equation: `Re = density * velocity * diameter / viscosity`
4. Save the node; it is now available in your project palette.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React, TailwindCSS, shadcn/ui |
| Canvas | React Flow (xyflow) v12 |
| Math Engine | mathjs |
| Database | InstantDB (realtime, collaborative) |
| Language | TypeScript |

---

<p align="center">
  <strong>calCAd</strong> — The collaborative engineering workspace for the modern engineer.
</p>