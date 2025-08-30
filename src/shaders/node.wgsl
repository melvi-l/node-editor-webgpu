struct Node {
    positionSize: vec4f,
    color: vec4f,
};

struct VertexInput {
    @location(0) quadPos: vec2f
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) local: vec2f
};

@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

@group(1) @binding(0)
var<uniform> uNode: Node;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;

    let scale = 0.5 * uNode.positionSize.zw;
    let local = input.quadPos.xy * scale + scale;
    let world = uNode.positionSize.xy + local;

    out.position = uProjectionMatrix * vec4<f32>(world, 0.0, 1.0);
    out.local = local;
    return out;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    return uNode.color;
}
