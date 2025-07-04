import GPUResources from "./GPUResources";
import ViewportUniform from "./ViewportUniform";

export interface ViewportSize {
    width: number;
    height: number;
}

export interface RenderContext {
    gpu: GPUResources;
    viewport: ViewportUniform;
}
