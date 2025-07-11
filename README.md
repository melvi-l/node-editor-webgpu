# WebGPU Graph Renderer

This project is a high-performance, modular graph rendering engine built using **WebGPU** and **TypeScript**. The main focus of this project is to serve as a playground for me to experiment with various graphic programming concept.

## Overview

The goal of this engine is to support interactive manipulation and visualization of graphs at scale
It is designed to be extensible, with a clear separation between data modeling (the graph in [`core`](/src/core/)), rendering logic (GPU in [`renderer`](/src/renderer/)),
interaction handling (through tool abstractions manage by an interactor in [`interaction`](/src/interaction)), and hit-testing (through a GPUPicking in [`picking`](/src/picking).

---

## Technical Architecture and Design Decisions

### Interaction Model: Tool-Based, Stateful Design

- Interaction is organized via a stateful tool system.
- The `Interactor` is the central input controller, dispatching pointer, keyboard, and wheel events to the currently active `Tool`.
- Tools encapsulate their own logic and state (`SelectTool`, `DragTool`, `ConnectTool`, etc.), enabling modular and scalable behavior.

### Unified GPU Instancing: Nodes & Handles

- A shared instancing buffer is used for both nodes and handles, enabling consistent rendering order and simplified pipeline management.
- Visual attributes like position, size, color, and kind (node or handle) are encoded per instance.
- Instance data is streamed to the GPU via a `ResizableFloat32Array` and backed by a `GPUBuffer`, allowing efficient partial updates.
- This unified approach ensures correct z-ordering (e.g., handles on top of nodes) without requiring multiple render passes.
- Handle are screen-space circles rendered using quads and a fragment shader distance field.

### Dirty Flag System: Fine-Grained Sync

- A dirty tracking system enables both global and per-element synchronization:
    - `dirty.global`: triggers a full re-sync of GPU buffers.
    - `dirty.nodes`, `dirty.edges`: track fine-grained updates for incremental sync.
- Each renderer (`NodeRenderer`, `EdgeRenderer`, etc.) implements `sync()` and `syncPartial()` methods, allowing it to update only the elements that changed.
- This improves rendering performance and responsiveness during interaction.

### GPU-Based Picking

- An offscreen render pass encodes picking IDs into RGB colors using an `RGBA8Unorm` texture.
- A compact ID-to-color encoding scheme minimizes GPU memory usage and bandwidth.
- A bidirectional mapping between internal numeric IDs and external unique IDs (`node-...`, `handle-...`, etc.) enables fast reverse lookups.
- Picking reads a 1×1 pixel region at the mouse position and decodes the color to resolve the selected element.

### Quad tree
- Using a QuadTree to effectively pick multiple element in a selection zone.

### Edge Rendering

- Edges are rendered with GPU instancing using stroke extansion in vertex shader.
- Supports miter joins for sharp corners.
- Edge geometry is computed per edge segment and updated independently via partial syncs.

### Compact Per-Handle Edge Registry

- A direct edge registry (`_edgeRegistry`) maps handle IDs to their corresponding edge ID, allowing O(1) access and dirty tracking.
- Since each handle can have at most one edge, this registry reduces iteration and lookup overhead significantly.

### Buffer Management & Memory Efficiency

- Resizable buffers automatically grow to accommodate graph size and reduce memory churn.
- All per-instance buffers are aligned with GPU memory layout expectations (e.g., 32 or 56 bytes per instance).

---

## Project Structure

```
/core             - Data model: Graph, Node, Edge, Handle
/renderer         - GPU rendering: NodeRenderer, EdgeRenderer, etc.
/picking          - Picking pass: color encoding and GPU readback
/interactor       - Input system with Tool routing
/shaders          - WGSL shader code
/utils            - Math, color, ID helpers
```

---

## Pipeline Overview

1. User Input
   The user interacts with the application through mouse, keyboard, or touch input.

2. Interactor and Active Tool
   Input events are processed by the Interactor, which delegates them to the currently active tool (e.g., DragTool, SelectTool, etc.).

3. Graph Mutation
   The active tool applies changes to the graph structure—adding, moving, or removing nodes, handles, or edges.

4. Renderer Synchronization
   After the graph is updated, the renderers (e.g., NodeRenderer, EdgeRenderer) synchronize their internal GPU buffers with the graph's current state. This update can be full or partial depending on what changed.

5. WebGPU Frame Rendering
   The current frame is rendered using WebGPU, displaying all graph elements on the canvas.

---

## Picking System

- A `PickingRenderer` performs a render pass where each instance is drawn with a unique RGB color that encodes its internal ID.
- The `PickingManager` maintains a bidirectional mapping between RGB values and element IDs.
- Only the 1x1 pixel under the cursor is read back asynchronously.
- Handles and nodes are currently supported; edge picking is planned.

---

## Roadmap

- [x] Basic deployment and demo via GitHub Pages
- [x] Dirty state system for local/global sync
- [x] Solving overlap: Per-object rendering OR Common instancing node-handle
- [x] Partial buffer update for local change (with offsetMap uid -> bufferOffset)
- [ ] Node zIndexing (maybe just split instancing for selectedNode)
- [ ] Complete interaction tool implementation (drag, select, connect)
- [ ] Zoom and pan support in the viewport
- [x] Group selection & apropriate SelectionTool
- [ ] Edge picking
- [ ] Minimap display
- [ ] Rounded line cap
- [ ] Automatic layout on multiple edge node

---

## Guiding Principles

- Real-time, GPU-accelerated rendering with minimal CPU involvement
- Clear architectural boundaries between core logic, rendering, and interaction
- Extensible system for interaction modes (via tools)
- Efficient memory and GPU resource usage

---

## License

This project is licensed under the MIT License.
