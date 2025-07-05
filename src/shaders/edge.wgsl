struct LineOptions {
    width: f32
}

struct VertexIn {
    @location(0) miterAndT: vec2f,
    @location(1) color: vec4f,
    @location(2) start: vec2f,
    @location(3) startNormal: vec2f,
    @location(4) end: vec2f,
    @location(5) endNormal: vec2f,
    @location(6) startMiterFactor: f32,
    @location(7) endMiterFactor: f32,
};

struct Out {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
};

@group(0) @binding(0) var<uniform> uProjectionMatrix: mat4x4<f32>;
@group(1) @binding(0) var<uniform> uOpts: LineOptions;

@vertex
fn vs_main(input: VertexIn) -> Out {
    var out: Out;

    let pos = mix(input.start, input.end, input.miterAndT.y);
    let normal = mix(input.startNormal, input.endNormal, input.miterAndT.y);
    let miterFactor = mix(input.startMiterFactor, input.endMiterFactor, input.miterAndT.y);
    let offset = normal * input.miterAndT.x * uOpts.width * 0.5 * miterFactor;

    let worldPos = pos + offset;

    out.position = uProjectionMatrix * vec4f(worldPos, 0.0, 1.0);
    out.color = input.color;

    return out;
}

@fragment
fn fs_main(input: Out) -> @location(0) vec4f {
    return input.color;
}
