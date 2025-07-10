struct VertexIn {
    @location(0) uvPos: vec2<f32>,
    @location(1) uv: vec2<f32>,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) fragUV: vec2<f32>,
    @location(1) size: vec2<f32>,
};


struct TransformUniforms {
    position: vec2<f32>,
    size: vec2<f32>,
};

struct StyleUniforms {
    backgroundColor: vec4<f32>,
    outlineColor: vec4<f32>,
    outlineWidth: f32,
};

@group(0) @binding(0)
var<uniform> uViewportMatrix: mat4x4<f32>; 

@group(1) @binding(0)
var<uniform> transform: TransformUniforms;

@group(1) @binding(1)
var<uniform> style: StyleUniforms;

@vertex
fn vs_main(input: VertexIn) -> VertexOut {
    let position = transform.position + input.uvPos * transform.size;

    let clip = uViewportMatrix * vec4<f32>(position, 0.0, 1.0);

    var output: VertexOut;
    output.position = clip;
    output.fragUV = input.uv;
    return output;
}

@fragment
fn fs_main(input: VertexOut) -> @location(0) vec4<f32> {
    let t = vec2f(style.outlineWidth, style.outlineWidth) / transform.size;

    let isBorder = input.fragUV.x < t.x || input.fragUV.x > (1.0 - t.x) || input.fragUV.y < t.y || input.fragUV.y > (1.0 - t.y);

    return select(style.backgroundColor, style.outlineColor, isBorder);
}

