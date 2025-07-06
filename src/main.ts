import Graph from "@/core/Graph";
import GPUResources from "@/renderer/GPUResources";
import Renderer from "@/renderer/Renderer";
import { colorHEX, colorRGBA } from "./utils/color";

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

    const renderer = new Renderer(gpu);
    await renderer.init();

    const graph = new Graph();

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
        size: [200, 100],
        color: g0,
    });
    const bh = graph.addHandle(b.id, {
        type: "input",
        color: g2,
    });
    const e = graph.addEdge({
        source: { nodeId: a.id },
        target: { nodeId: b.id },
    });

    renderer.syncGraph(graph);

    function frame() {
        renderer.render();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.addEventListener("resize", () => {
        renderer.resize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    });
}

main(window.innerWidth, window.innerHeight);
