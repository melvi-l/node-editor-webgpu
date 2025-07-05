export type Vec2 = [number, number];

export const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
export const scale = (v: Vec2, s: number): Vec2 => [v[0] * s, v[1] * s];
export const dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1];

export const length = (v: Vec2): number => Math.hypot(v[0], v[1]);
export const normalize = (v: Vec2): Vec2 => {
    const len = length(v);
    return len > 0 ? scale(v, 1 / len) : [0, 0];
};

export const normal = (v: Vec2): Vec2 => [-v[1], v[0]];

export const equal = (a: Vec2, b: Vec2, epsilon = 1e-6): boolean =>
    Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon;

export function direction(a: Vec2, b: Vec2) {
    return normalize(sub(b, a));
}

export function computeMitter(dirA: Vec2, dirB: Vec2) {
    const tangente = normalize(add(dirA, dirB));

    const miter: Vec2 = normal(tangente);
    const tmp: Vec2 = normal(dirA);

    const miterFactor = 1 / dot(miter, tmp);

    return { miter, miterFactor };
}
