import { scale, Vec2 } from "@/utils/math";

type Zone = { position: Vec2; size: Vec2 };
type Item<T> = { bounds: Zone; data: T };

export class QuadTree<T> {
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

    insert(item: Item<T>): boolean {
        if (!this.intersects(this.bounds, item.bounds)) return false;

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

    query(area: Zone, found: T[] = []): T[] {
        if (!this.intersects(this.bounds, area)) return found;

        for (const item of this.items) {
            if (this.intersects(item.bounds, area)) {
                found.push(item.data);
            }
        }

        if (this.children) {
            for (const child of this.children) {
                child.query(area, found);
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

    private intersects(
        { position: [ax, ay], size: [aw, ah] }: Zone,
        { position: [bx, by], size: [bw, bh] }: Zone,
    ): boolean {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }
}
