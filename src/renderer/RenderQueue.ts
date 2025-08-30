export type SortKey = bigint;
export enum Layer {
    Background = 0,
    Default = 1,
}
export function makeSortKey(layer: Layer, z: number): SortKey {
    return (BigInt(layer) << 32n) | BigInt(z >>> 0);
}

export interface DrawCmd {
    key: SortKey;
    execute: (pass: GPURenderPassEncoder) => void;
}

export class RenderQueue {
    private commandArray: DrawCmd[] = [];
    clear() {
        this.commandArray.length = 0;
    }
    push(cmd: DrawCmd) {
        this.commandArray.push(cmd);
    }
    flush(pass: GPURenderPassEncoder) {
        this.commandArray.sort((a, b) =>
            a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
        );
        for (const command of this.commandArray) command.execute(pass);
    }
    get instance() {
        return this.commandArray;
    }
}
