struct LineOptions {
    width: f32
}

struct VertexInput {
    @location(0) color: vec4f,
    @location(1) position: vec2f, // naming could be improve
    @location(2) normal: vec2f,
    @location(3) miter: f32,
}

struct Out {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
};

@group(0) @binding(0)
var<uniform> uProjectionMatrix: mat4x4<f32>;

@group(1) @binding(0) 
var<uniform> uOpts: LineOptions;

@vertex
fn vs_main(input: VertexInput) -> Out {
    var output: Out;

    let offset = input.normal * (uOpts.width * 0.5) * input.miter;
    let worldPos = input.position + offset;

    output.position = uProjectionMatrix * vec4f(worldPos, 0.0, 1.0);
    output.color = input.color;

    return output;
}

@fragment
fn fs_main(input: Out) -> @location(0) vec4f {
    return input.color;
}
