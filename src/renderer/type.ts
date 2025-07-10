import GPUResources from "./GPUResources";
import Viewport from "./Viewport";

export interface ViewportSize {
    width: number;
    height: number;
}

export interface RenderContext {
    gpu: GPUResources;
    viewport: Viewport;
    state: RenderState;
}

export interface RenderState {
    hoveredId: string | null;
    selectedIdSet: Set<string>;
}

export interface Uniform {
    buffer: GPUBuffer;
    bindGroup: GPUBindGroup;
    bindGroupLayout: GPUBindGroupLayout;
}
