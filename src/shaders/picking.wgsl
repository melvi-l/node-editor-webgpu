struct VertexInput {
    @location(0) localPos: vec2f,
    @location(1) instancePos: vec2f,
    @location(2) instanceSize: vec2f,
    @location(3) instanceColor: vec4f,
};

struct Out {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
};

@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

@vertex
fn vs_main(input: VertexInput) -> Out {
    var out: Out;

    let worldPos = input.instancePos + input.localPos * input.instanceSize;

    out.position = uProjectionMatrix * vec4f(worldPos, 0.0, 1.0);
    out.color = input.instanceColor.rgb;

    return out;
} 

@fragment
fn fs_main(input: Out) -> @location(0) vec4f {
    return vec4f(input.color, 1.);
}

