import { NodeStyle } from "@/core/Node";
import { Vec4 } from "./math";

type HexString = `#${string}`;
export function colorHEX(hex: string): [number, number, number, number] {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) {
        throw new Error(`Invalid hex color: ${hex}`);
    }

    let r: number,
        g: number,
        b: number,
        a: number = 255;

    if (hex.length === 4) {
        // Format #RGB
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
        a = 255;
    } else if (hex.length === 5) {
        // Format #RGBA
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
        a = parseInt(hex[4] + hex[4], 16);
    } else if (hex.length === 7) {
        // Format #RRGGBB
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
        a = 255;
    } else {
        // Format #RRGGBBAA
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
        a = parseInt(hex.slice(7, 9), 16);
    }

    return [r / 255, g / 255, b / 255, a / 255];
}

export function toHEX(color: Vec4): HexString {
    const [r, g, b, a] = color;

    const _toHex = (value: number) => {
        const v = Math.round(value * 255);
        return v.toString(16).padStart(2, "0");
    };

    return `#${_toHex(r)}${_toHex(g)}${_toHex(b)}${a !== 1 ? _toHex(a) : ""}` as HexString;
}

export function colorRGBA(rgba255: Vec4): Vec4 {
    return rgba255.map((c) => c / 255) as Vec4;
}
export function toRGBA(rgba1: Vec4): Vec4 {
    return rgba1.map((c) => Math.round(c * 255)) as Vec4;
}

const NODE_STYLE_SAMPLE: NodeStyle[] = [
    {
        backgroundColor: {
            default: colorRGBA([38, 70, 83, 255]),
            selected: colorRGBA([48, 80, 93, 255]),
        },
        outlineColor: {
            default: colorRGBA([0, 0, 0, 0]),
            selected: colorRGBA([1, 1, 1, 1]),
        },
        outlineWidth: 2,
    },

    {
        backgroundColor: {
            default: colorRGBA([42, 157, 143, 255]),
            selected: colorRGBA([52, 167, 153, 255]),
        },
        outlineColor: {
            default: colorRGBA([0, 0, 0, 0]),
            selected: colorRGBA([1, 1, 1, 1]),
        },
        outlineWidth: 2,
    },
    {
        backgroundColor: {
            default: colorRGBA([233, 196, 106, 255]),
            selected: colorRGBA([243, 206, 116, 255]),
        },
        outlineColor: {
            default: colorRGBA([0, 0, 0, 0]),
            selected: colorRGBA([1, 1, 1, 1]),
        },
        outlineWidth: 2,
    },
    {
        backgroundColor: {
            default: colorRGBA([244, 162, 97, 255]),
            selected: colorRGBA([254, 172, 107, 255]),
        },
        outlineColor: {
            default: colorRGBA([0, 0, 0, 0]),
            selected: colorRGBA([1, 1, 1, 1]),
        },
        outlineWidth: 2,
    },
    {
        backgroundColor: {
            default: colorRGBA([231, 111, 81, 255]),
            selected: colorRGBA([241, 121, 91, 255]),
        },
        outlineColor: {
            default: colorRGBA([0, 0, 0, 0]),
            selected: colorRGBA([1, 1, 1, 1]),
        },
        outlineWidth: 2,
    },
];

export function getNodeStyleFromUUID(uuid: string): NodeStyle {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
        const code = uuid.charCodeAt(i);
        hash = (hash * 31 + code) >>> 0;
    }
    const index = hash % NODE_STYLE_SAMPLE.length;

    return NODE_STYLE_SAMPLE[index];
}
