export function makeOrthoProjection(
    width: number,
    height: number,
    zoom: number,
    panX: number,
    panY: number,
): Float32Array {
    return new Float32Array([
        (2 * zoom) / width, 0, 0, 0,
        0, (-2 * zoom) / height, 0, 0,
        0, 0, 1, 0,
        -1 - (2 * panX * zoom) / width, 1 + (2 * panY * zoom) / height, 0, 1,
    ]);
}

export function makeinvertedOrthoProjection(
    width: number,
    height: number,
    zoom: number,
    panX: number,
    panY: number,
): Float32Array {
    return new Float32Array([
        width / (2 * zoom), 0, 0, 0,
        0, -height / (2 * zoom), 0, 0,
        0, 0, 1, 0,
        width / (2 * zoom) + panX, height / (2 * zoom) + panY, 0, 1,
    ]);
}
