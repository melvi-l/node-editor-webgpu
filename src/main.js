async function main(...size) {
  if (!navigator.gpu) {
    alert("no webGPU, please use a compatible browser (https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)");
  }

  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter) {
    alert("no GPU adapter");
  }

  const device = await adapter.requestDevice();
  console.log("using device:", device);
  device.addEventListener("uncapturederror", (ev) =>
    console.log(ev.error.message),
  );

  const format = navigator.gpu.getPreferredCanvasFormat();
  console.log("using format:", format);

  const canvas = document.getElementById("webgpu");
  if (canvas == null) {
    throw new Error("No canvas in html template");
  }
  canvas.width = size[0];
  canvas.height = size[1];
  const ctx = canvas.getContext("webgpu");
  ctx.configure({
    device,
    format,
  });
}

main(window.innerWidth, window.innerHeight);
