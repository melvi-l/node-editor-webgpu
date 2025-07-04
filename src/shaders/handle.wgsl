@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

struct Out {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) local: vec2<f32>
};

@vertex
fn vs_main(
    @location(0) quadPos: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) center: vec2<f32>,
    @location(3) radius: f32,
) -> Out {
    var out: Out;
    let scaled = quadPos * radius;
    let worldPos = center + scaled;

    out.position = uProjectionMatrix * vec4<f32>(worldPos, 0.0, 1.0);
    out.color = color;
    out.local = quadPos;

    return out;
}

@fragment
fn fs_main(input: Out) -> @location(0) vec4<f32> {
    let dist = length(input.local);

    let aa = fwidth(dist);
    let mask = smoothstep(1.0, 1.0 - aa, dist);

    return input.color * mask;
}
