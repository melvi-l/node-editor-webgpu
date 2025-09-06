struct Out {
    @builtin(position) position: vec4<f32>,
    @location(0) world: vec4<f32>,
};

struct Opts {
    color: vec4f,
    unit: f32,
    width: f32,
}

@group(0) @binding(0) var<uniform> uInvertedProjectionMatrix: mat4x4<f32>;
@group(1) @binding(0) var<uniform> uOpts: Opts;

@vertex
fn vs_main(@location(0) position: vec2f) -> Out {
    var out: Out;

    out.position = vec4f(position, 0.0, 1.0);
    out.world = uInvertedProjectionMatrix * out.position ;
    return out;
}

@fragment
fn fs_main(in: Out) -> @location(0) vec4<f32> {
    let fx = fract(in.world.x / uOpts.unit);
    let fy = fract(in.world.y / uOpts.unit);
    let width = uOpts.width / uOpts.unit;
    if fx < width || fy < width {
        return uOpts.color;
    }
    return vec4f(0.);
}
