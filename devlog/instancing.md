# Devlog

## @c06b0a1: Rendering 1 Million Nodes

The purpose of this project was to explore a fully instanced WebGPU-based node editor, targeting an extreme use case that **ABSOLUTELY NOBODY** asked for: rendering a graph with 1 million nodes.

To achieve this, the core strategy was to minimize CPU → GPU memory transfers and reduce the number of draw calls through aggressive batching and GPU instancing.

However, this design exposed a subtle rendering issue: overlapping between nodes and handles. For instance, if node A is drawn above node B,
but handles are rendered afterward as a separate batch, handles from B can incorrectly appear above node A.

This happens because nodes and handles are batch-rendered separately, ignoring any z-ordering or render priority between them.

**Identified Solutions**

- Non-instanced per-element rendering
  A straightforward fix: issue a draw call for every individual element (node or handle). While this would solve the depth issue, it defeats the point of instancing and sacrifices performance. Not ideal for our ambitious “1 million nodes” target.

- Prevent overlapping altogether
  Enforcing non-overlapping node placement avoids the problem entirely. This sidesteps rendering concerns but adds complexity in layout and feels more like a physics workaround than a proper rendering solution.

- Unified batching of nodes and handles (BATCHING EVEN MORE)
  The most promising and technically elegant solution: batch nodes and handles into the same instanced draw call. Since both are rendered as quads,
  it’s feasible to encode their type (node or handle) in a per-instance flag and switch behavior within a shared shader. This enables correct z-ordering without sacrificing instancing benefits.

Although this third solution is also the most complex, it aligns with the spirit of the project. Therefore, it will be the next direction of exploration.
