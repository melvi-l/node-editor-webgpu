import { Vec4 } from "./math";

type HexString = `#${string}`;
export function colorHEX(hex: HexString): Vec4 {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
        throw new Error(`Invalid hex color: ${hex}`);
    }

    let r: number, g: number, b: number;

    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }

    return [r / 255, g / 255, b / 255, 1];
}
export function toHEX(color: Vec4): HexString {
    const [r, g, b] = color;

    const _toHex = (value: number) => {
        const v = Math.round(value * 255);
        return v.toString(16).padStart(2, "0");
    };

    return `#${_toHex(r)}${_toHex(g)}${_toHex(b)}` as HexString;
}

export function colorRGBA(rgba255: Vec4): Vec4 {
    return rgba255.map((c) => c / 255) as Vec4;
}
export function toRGBA(rgba1: Vec4): Vec4 {
    return rgba1.map((c) => Math.round(c * 255)) as Vec4;
}

const PALETTE: [number, number, number, number][] = [
    colorRGBA([38, 70, 83, 255]),
    colorRGBA([42, 157, 143, 255]),
    colorRGBA([233, 196, 106, 255]),
    colorRGBA([244, 162, 97, 255]),
    colorRGBA([231, 111, 81, 255]),
];

export function getColorFromUUID(
    uuid: string,
): [number, number, number, number] {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
        const code = uuid.charCodeAt(i);
        hash = (hash * 31 + code) >>> 0;
    }
    const index = hash % PALETTE.length;

    return PALETTE[index];
}
