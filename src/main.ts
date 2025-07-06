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

    // renderer.syncGraph()

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
