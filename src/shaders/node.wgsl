struct Out {
    @builtin(position) position: vec4f,
    @location(3) color: vec4f,
};

@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

@vertex
fn vs_main(
    @location(0) localPos: vec2f,
    @location(1) nodePos: vec2f,
    @location(2) nodeSize: vec2f,
    @location(3) nodeColor: vec4f
) -> Out {
    var out: Out;

    let worldPos = nodePos + localPos * nodeSize;
    out.position = uProjectionMatrix * vec4f(worldPos, 0.0, 1.0);
    out.color = nodeColor;
    return out;
}

@fragment
fn fs_main(input: Out) -> @location(0) vec4<f32> {
    return input.color;
}


