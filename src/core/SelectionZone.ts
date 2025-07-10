import { Vec2 } from "@/utils/math";

export default class SelectionZone {
    private _position: Vec2;
    private _size: Vec2;
    constructor(position: Vec2 = [0, 0], size: Vec2 = [0, 0]) {
        this._position = position;
        this._size = size;
    }
    get position() {
        return this._position;
    }
    get size() {
        return this._size;
    }
    setPosition(position: Vec2) {
        this._position = position;
    }
    setSize(size: Vec2) {
        this._size = size;
    }
    reset() {
        this._position = [0, 0];
        this._size = [0, 0];
    }
}
