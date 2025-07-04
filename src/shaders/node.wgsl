@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

struct Node {
    position: vec2<f32>,
    size: vec2<f32>,
    color: vec4<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(3) color: vec4<f32>,
};

@vertex
fn vs_main(
    @location(0) localPos: vec2<f32>,
    @location(1) nodePos: vec2<f32>,
    @location(2) nodeSize: vec2<f32>,
    @location(3) nodeColor: vec4<f32>
) -> VertexOutput {
    var out: VertexOutput;

    let worldPos = nodePos + localPos * nodeSize;
    out.position = uProjectionMatrix * vec4<f32>(worldPos, 0.0, 1.0);
    out.color = nodeColor;
    return out;
}

@fragment
fn fs_main(@location(3) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}


