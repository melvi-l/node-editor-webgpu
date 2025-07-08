export class ResizableFloat32Array {
    private buffer: Float32Array;
    private _length: number;

    constructor(initialCapacity: number = 1024) {
        this.buffer = new Float32Array(initialCapacity);
        this._length = 0;
    }

    ensureCapacity(requiredElements: number) {
        if (requiredElements > this.buffer.length) {
            const newCapacity = Math.max(
                requiredElements,
                this.buffer.length * 2,
            );
            const newBuffer = new Float32Array(newCapacity);
            newBuffer.set(this.buffer.subarray(0, this._length));
            this.buffer = newBuffer;
        }
        this._length = requiredElements;
    }

    reset() {
        this._length = 0;
    }

    get data(): Float32Array {
        return this.buffer;
    }

    get used(): Float32Array {
        return this.buffer.subarray(0, this._length);
    }

    get size(): number {
        return this._length;
    }

    get capacity(): number {
        return this.buffer.length;
    }
}
