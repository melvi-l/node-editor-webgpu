struct VertexInput {
    @location(0) quadPos: vec2f,
    @location(1) color: vec4f,
    @location(2) center: vec2f,
    @location(3) radius: f32,
}

struct Out {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) local: vec2f
};

@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

@vertex
fn vs_main(
    input: VertexInput
) -> Out {
    var out: Out;
    let scaled = input.quadPos * input.radius;
    let worldPos = input.center + scaled;

    out.position = uProjectionMatrix * vec4f(worldPos, 0.0, 1.0);
    out.color = input.color;
    out.local = input.quadPos;

    return out;
}

@fragment
fn fs_main(input: Out) -> @location(0) vec4f {
    let dist = length(input.local);

    let aa = fwidth(dist);
    let mask = smoothstep(1.0, 1.0 - aa, dist);

    return input.color * mask;
}
