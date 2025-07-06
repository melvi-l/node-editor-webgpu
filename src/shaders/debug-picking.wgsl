@group(0) @binding(0) var pickingTex: texture_2d<f32>;
@group(0) @binding(1) var pickingSampler: sampler;

struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@location(0) pos: vec2<f32>, @location(1) uv: vec2<f32>) -> VertexOut {
    var out: VertexOut;
    out.pos = vec4<f32>(pos, 0.0, 1.0);
    out.uv = vec2<f32>(uv.x, 1. - uv.y) ;
    return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
    let texColor = textureSample(pickingTex, pickingSampler, in.uv);
    return vec4<f32>(texColor.rgb, .3); // 50% alpha overlay
}

