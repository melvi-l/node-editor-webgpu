import { scale, Vec2 } from "@/utils/math";
import { Zone } from "./type";
import { AreaPicker, PositionPicker } from "./Picker";

type Item<T> = { bounds: Zone; data: T };

export class QuadTree<T> implements PositionPicker<T>, AreaPicker<T>  {
    private items: Item<T>[] = [];
    private children: QuadTree<T>[] | null = null;
    private readonly bounds: Zone;
    private readonly capacity: number;
    private readonly depth: number;

    constructor(bounds: Zone, capacity = 4, depth = 0) {
        this.bounds = bounds;
        this.capacity = capacity;

        this.depth = depth;
    }

    pickPosition(position: Vec2): T[] {
        return this.query(position, this.isInside, [])
    }

    pickArea(area: Zone):T[] {
        return this.query(area, this.isIntersecting, [])
    }

    insert(item: Item<T>): boolean {
        if (!this.isIntersecting(item.bounds, this.bounds)) return false;

        if (!this.children && this.items.length < this.capacity) {
            this.items.push(item);
            return true;
        }

        if (!this.children) this.subdivide();

        for (const child of this.children!) {
            if (child.insert(item)) return true;
        }

        return false;
    }

    query<U>(selector: U, testingFn: (s: U, bound: Zone) => boolean, found: T[]): T[] {
        if (!testingFn(selector, this.bounds)) return found;

        for (const item of this.items) {
            if (testingFn(selector, this.bounds)) {
                found.push(item.data);
            }
        }

        if (this.children) {
            for (const child of this.children) {
                child.query<U>(selector, testingFn, found);
            }
        }

        return found;
    }


    clear() {
        this.items = [];
        this.children = null;
    }

    private subdivide() {
        const { position, size } = this.bounds;
        const [x, y] = position;
        const [hw, hh] = scale(size, 2);
        this.children = [
            new QuadTree(
                { position, size: [hw, hh] },
                this.capacity,
                this.depth + 1,
            ),
            new QuadTree(
                { position: [x + hw, y], size: [hw, hh] },
                this.capacity,
                this.depth + 1,
            ),
            new QuadTree(
                { position: [x, y + hh], size: [hw, hh] },
                this.capacity,
                this.depth + 1,
            ),
            new QuadTree(
                { position: [x + hw, y + hh], size: [hw, hh] },
                this.capacity,
                this.depth + 1,
            ),
        ];
    }

    private isIntersecting(
        { position: [ax, ay], size: [aw, ah] }: Zone,
        { position: [bx, by], size: [bw, bh] }: Zone,
    ): boolean {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    private isInside(
        [ax, ay]: Vec2,
        { position: [bx, by], size: [bw, bh] }: Zone
    ): boolean {
        return ax < bx + bw && ax > bx && ay < by + bh && ay > by
    }
}
