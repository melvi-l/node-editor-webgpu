struct VertexInput {
    @location(0) quadPos: vec2f,
    @location(1) position: vec2f,
    @location(2) sizeOrRadius: vec2f,
    @location(3) color: vec4f,
    @location(4) @interpolate(flat) kind: u32,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) local: vec2f,
    @location(2) @interpolate(flat) kind: u32,
};


@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;

    let isHandle = input.kind != 0u;

    let scale = select(input.sizeOrRadius / 2.0, vec2f(input.sizeOrRadius.x), isHandle);
    let offset = select(input.sizeOrRadius / 2.0, vec2f(0.0), isHandle);

    let local = input.quadPos * scale;
    let world = input.position + offset + local;

    out.position = uProjectionMatrix * vec4f(world, 0.0, 1.0);
    out.color = input.color;
    out.local = input.quadPos;
    out.kind = input.kind;


    return out;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    var mask = 1.0;

    let dist = length(input.local);
    let aa = max(fwidth(dist), 0.001);

    if input.kind != 0u {
        mask = smoothstep(1.0, 1.0 - aa, dist);
    }

    return input.color * mask;
}


