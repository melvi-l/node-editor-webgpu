import { getType } from "@/utils/id";
import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";
import { DragNodeTool } from "./DragNodeTool";
import ConnectTool from "./ConnectTool";

export default class BaseTool implements InteractionTool {
    constructor(
        private interactor: Interactor,
        private graph: Graph,
    ) { }

    async onPointerDown(e: PointerEvent) {
        const id = await this.interactor.pick();
        console.log(id);

        if (!id) return;

        const type = getType(id);

        if (type === "node") {
            this.interactor.setTool(
                new DragNodeTool(this.interactor, this.graph, id),
            );
        } else if (type === "handle") {
            this.interactor.setTool(
                new ConnectTool(this.interactor, this.graph, id),
            );
        } else {
            return;
        }

        this.interactor.forwardEventToTool("onPointerDown", e);
    }
}
