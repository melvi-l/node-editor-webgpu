export function makeOrthoProjection(
    width: number,
    height: number,
): Float32Array {
    return new Float32Array([
        2 / width,
        0,
        0,
        0,
        0,
        -2 / height,
        0,
        0,
        0,
        0,
        1,
        0,
        -1,
        1,
        0,
        1,
    ]);
}
