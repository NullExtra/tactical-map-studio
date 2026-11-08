# Tactical Map Studio & AI Navigation Engine

> Web-based game development tooling, procedural level generator, and pathfinding algorithm simulation suite built for technical portfolios.

![Tech Stack](https://img.shields.io/badge/Tech-React_%7C_TypeScript_%7C_Vite_%7C_Tailwind-blue)
![Security](https://img.shields.io/badge/Security-100%25_Client_Side_%7C_Zero_API_Keys-success)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Overview
**Tactical Map Studio** is a high-performance, client-side game engineering tool designed to demonstrate core computer science principles in game development. It features procedural map generation, weighted graph pathfinding, 2.5D grid rendering, and real-time raycasting field-of-view (FoV) calculations entirely in the browser without external dependencies.

---

## 🛠️ Technical Architecture & Features

1. **Procedural Level Generation (3 Algorithms):**
   * **Tactical Chambers (BSP + Corridor carving):** Generates structured rooms connected by orthogonal hallways.
   * **Organic Caves (Cellular Automata):** Simulates natural cave systems using neighbor-state iterative smoothing.
   * **Braided Maze:** Implements randomized depth-first search with loop-carving to provide multiple alternative routes.
2. **Pathfinding Engine (A*, Dijkstra, BFS):**
   * Computes optimal routes across multi-terrain grids (Standard Floor, Water Terrain with 2x movement cost, and Chokepoints with 3x movement cost).
   * Supports 4-directional and 8-directional (diagonal) movement constraints with corner-cutting collision prevention.
   * Supports intermediate Waypoints (`P`) for complex patrol routing (`A -> P -> B`).
3. **2D Raycasting Field-of-View (Fog of War):**
   * Implements Bresenham's line-of-sight algorithm to calculate real-time visibility shadows cast by 2.5D obstacles.
4. **Agent Simulation & Telemetry:**
   * Live step-by-step agent traversal along computed paths with real-time performance readouts in milliseconds (`ms`).

---

## 🚀 Quick Start & Installation

Clone the repository and run it locally:

```bash
# Clone the repository
git clone [https://github.com/NullExtra/tactical-map-studio.git](https://github.com/NullExtra/tactical-map-studio.git)

# Navigate into the directory
cd tactical-map-studio

# Install dependencies
npm install

# Start local development server
npm run dev