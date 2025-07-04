import Edge from "@/core/Edge";
import { RenderContext } from "./type";

export default class EdgeRenderer {
    context: RenderContext;
    constructor(context: RenderContext) {
        this.context = context;
    }
    async init() { }
    sync(edgeArray: Edge[]) { }
    render(pass: GPURenderPassEncoder) { }
}
