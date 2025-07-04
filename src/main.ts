import GPUResources from "./renderer/GPUResources";
import Renderer from "./renderer/Renderer";

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

    renderer.syncGraph({
        nodes: [
            { position: [0, 0], size: [0.5, 0.5], color: [1, 0, 0, 1] },
            { position: [-0.5, -0.5], size: [0.25, 0.5], color: [0, 1, 0, 1] },
        ],
        edges: [],
    });

    function frame() {
        renderer.render();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

main(window.innerWidth, window.innerHeight);
