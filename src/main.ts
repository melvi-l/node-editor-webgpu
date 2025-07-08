import Graph from "@/core/Graph";
import GPUResources from "@/renderer/GPUResources";
import Renderer from "@/renderer/Renderer";
import { colorHEX } from "./utils/color";
import { Interactor } from "./interaction/Interactor";
import Viewport from "./renderer/Viewport";
import { PickingManager } from "./picking/PickingManager";
import { DebugTextureRenderer } from "./debug/DebugRenderer";

async function main(...size: [number, number]) {
    if (!navigator.gpu) {
        alert(
            "no webGPU, please use a compatible browser (https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)",
        );
        return;
    }

    const canvas = document.getElementById("webgpu");
    if (canvas == null || !(canvas instanceof HTMLCanvasElement)) {
        throw new Error("No canvas in html template");
    }
    canvas.width = size[0];
    canvas.height = size[1];

    const gpu = new GPUResources(canvas);
    await gpu.init();

    const context = {
        gpu,
        viewport: new Viewport(gpu, gpu.canvasSize),
        state: { hoveredId: null, selectedId: null },
    };
    const graph = new Graph();

    const pickingManager = new PickingManager(context, graph);
    await pickingManager.init();

    // Debug
    let debugRenderer = undefined;
    if (false) {
        debugRenderer = new DebugTextureRenderer(context);
        debugRenderer.init(pickingManager.texture);
    }

    const renderer = new Renderer(context, debugRenderer);
    await renderer.init();

    const interactor = new Interactor(pickingManager, graph, context);

    const g0 = colorHEX("#555");
    const g1 = colorHEX("#777");
    const g2 = colorHEX("#999");

    const a = graph.addNode({
        position: [100, 100],
        size: [200, 100],
        color: g0,
    });

    const ah = graph.addHandle(a.id, {
        type: "output",
        color: g2,
    });
    graph.addHandle(a.id, { type: "output", color: g1 });

    const b = graph.addNode({
        position: [800, 600],
        size: [50, 100],
        color: g0,
    });
    const bh = graph.addHandle(b.id, {
        type: "input",
        color: g2,
    });
    graph.addHandle(b.id, {
        type: "input",
        color: g2,
    });
    const e = graph.addEdge({
        source: { nodeId: a.id },
        target: { nodeId: b.id },
    });

    function frame(now: DOMHighResTimeStamp) {
        interactor.update(now);
        renderer.syncGraph(graph);
        renderer.render();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.addEventListener("resize", () => {
        renderer.resize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
        pickingManager.resize();
    });
}

main(window.innerWidth, window.innerHeight);
