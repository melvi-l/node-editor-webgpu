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
            {
                position: [400, 300],
                size: [100, 100],
                color: [1, 0, 0, 1],
            },
            {
                position: [200, 150],
                size: [50, 100],
                color: [0, 1, 0, 1],
            },
        ],
        edges: [],
        handles: [
            {
                position: [350, 250],
                color: [1, 1, 1, 1],
            },
            {
                position: [450, 350],
                color: [1, 1, 0, 1],
            },
            {
                position: [200, 150],
                color: [0, 1, 1, 1],
            },
            {
                position: [800, 0],
                color: [1, 0, 1, 1],
            },
        ],
    });

    function frame() {
        renderer.render();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.addEventListener("resize", () => {
        renderer.resize({ width: window.innerWidth, height: window.innerHeight });
    });
}

main(window.innerWidth, window.innerHeight);
