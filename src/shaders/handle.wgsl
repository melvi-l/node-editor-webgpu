@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

struct Out {
    @builtin(position) position: vec4<f32>,
    @location(2) color: vec4<f32>,
};

@vertex
fn vs_main(
    @location(0) local: vec2<f32>,
    @location(1) center: vec2<f32>,
    @location(2) color: vec4<f32>
) -> Out {
    var out: Out;
    let scale = vec2<f32>(6.0, 6.0);
    let worldPos = center + local * scale;
    out.position = uProjectionMatrix * vec4<f32>(worldPos, 0.0, 1.0);
    out.color = color;
    return out;
}

@fragment
fn fs_main(@location(2) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
