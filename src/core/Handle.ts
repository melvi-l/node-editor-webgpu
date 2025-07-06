import { Vec2, Vec4 } from "@/utils/math";

export default class Handle {
    id: string;
    position: Vec2;
    color: Vec4;
    radius?: number;

    constructor({ position, color }: { position: Vec2; color?: Vec4 }) {
        this.id = crypto.randomUUID();
        this.position = position;
        this.color = color ?? [160, 160, 160, 160];
    }
}
