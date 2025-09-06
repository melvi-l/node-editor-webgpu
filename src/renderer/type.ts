import GPUResources from "./GPUResources";
import Viewport from "./Viewport";

export interface ViewportParams {
    width: number;
    height: number;
    zoom: number;
    panX: number;
    panY: number;
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
