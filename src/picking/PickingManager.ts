import { RenderContext } from "@/renderer/type";
import { PickingRenderer } from "./PickingRenderer";

import Graph from "@/core/Graph";

export class PickingManager {
    private context: RenderContext;
    private renderer: PickingRenderer;
    private graph: Graph;

    private idCounter = 1;
    private idMap = new Map<string, number>(); // string → int
    private reverseIdMap = new Map<number, string>(); // int → string

    private pickingTexture!: GPUTexture;
    private pickingView!: GPUTextureView;
    private readBuffer!: GPUBuffer;

    constructor(context: RenderContext, graph: Graph) {
        this.context = context;
        this.renderer = new PickingRenderer(context, this);
        this.graph = graph;
    }

    async init() {
        await this.renderer.init();
        this.resize();
    }

    resize() {
        const { width, height } = this.context.gpu.canvasSize;

        this.pickingTexture = this.context.gpu.device.createTexture({
            size: { width, height },
            format: "rgba8unorm",
            usage:
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_SRC |
                GPUTextureUsage.TEXTURE_BINDING, // debug
        });

        this.pickingView = this.pickingTexture.createView();

        this.readBuffer = this.context.gpu.initBuffer(
            4,
            GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        );
    }

    encodeIdToColor(id: number): [number, number, number] {
        return [(id >> 16) & 0xff, (id >> 8) & 0xff, id & 0xff];
    }

    decodeColorToId(r: number, g: number, b: number): number {
        return (r << 16) | (g << 8) | b;
    }

    getOrCreateId(stringId: string): number {
        if (this.idMap.has(stringId)) return this.idMap.get(stringId)!;
        const id = this.idCounter++;
        this.idMap.set(stringId, id);
        this.reverseIdMap.set(id, stringId);
        return id;
    }

    async pick(x: number, y: number): Promise<string | null> {
        const { encoder, pass } = this.context.gpu.beginFrame({
            colorAttachments: [
                {
                    view: this.pickingView,
                    clearValue: { r: 0.2, g: 0, b: 0, a: 1 },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        });

        this.renderer.sync(this.graph);
        this.renderer.render(pass);
        pass.end();

        encoder.copyTextureToBuffer(
            {
                texture: this.pickingTexture,
                origin: { x, y },
            },
            {
                buffer: this.readBuffer,
                bytesPerRow: 256,
            },
            {
                width: 1,
                height: 1,
                depthOrArrayLayers: 1,
            },
        );

        this.context.gpu.device.queue.submit([encoder.finish()]);
        await this.context.gpu.device.queue.onSubmittedWorkDone();

        await this.readBuffer.mapAsync(GPUMapMode.READ);
        const data = new Uint8Array(this.readBuffer.getMappedRange());
        const r = data[0],
            g = data[1],
            b = data[2];
        this.readBuffer.unmap();

        const id = this.decodeColorToId(r, g, b);
        return this.reverseIdMap.get(id) ?? null;
    }

    get texture() {
        return this.pickingTexture;
    }
}
