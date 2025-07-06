import Edge from "./Edge";
import Handle from "./Handle";
import Node from "./Node";

export default class Graph {
    nodes = new Map<string, Node>();
    edges = new Map<string, Edge>();
    private _handleRegistry = new Map<
        string,
        { handle: Handle; nodeId: string }
    >();

    constructor() {}

    init(nodeArray: Node[], edgeArray: Edge[]) {
        this.nodes = new Map(nodeArray.map((node) => [node.id, node]));
        this.edges = new Map(edgeArray.map((edge) => [edge.id, edge]));
        this._handleRegistry.clear();
        this.nodes.forEach((node) =>
            node.handles.forEach((handle) =>
                this._handleRegistry.set(handle.id, {
                    handle,
                    nodeId: node.id,
                }),
            ),
        );
    }

    addNode(node: Node): Node {
        if (this.nodes.has(node.id))
            throw new Error(`Node ${node.id} already exists.`);

        this.nodes.set(node.id, node);
        return node;
    }
    addEdge(edge: Edge): Edge {
        if (this.edges.has(edge.id))
            throw new Error(`Edge ${edge.id} already exists.`);

        this.edges.set(edge.id, edge);
        return edge;
    }
    addHandle(nodeId: string, handle: Handle): Handle {
        if (this._handleRegistry.has(handle.id))
            throw new Error(`Edge ${handle.id} already exists.`);

        const node = this.getNode(nodeId);
        if (!node) throw new Error(`Node ${nodeId} not found`);
        node.handles.push(handle);

        this._handleRegistry.set(handle.id, {
            handle,
            nodeId,
        });
        return handle;
    }

    removeNode(nodeId: string) {
        this.nodes.delete(nodeId);
        for (const [edgeId, edge] of this.edges) {
            if (
                edge.source.nodeId === nodeId ||
                edge.target.nodeId === nodeId
            ) {
                this.edges.delete(edgeId);
            }
        }
    }
    removeEdge(edgeId: string) {
        this.edges.delete(edgeId);
    }
    removeHandle(handleId: string) {
        for (const node of this.nodes.values()) {
            const index = node.handles.findIndex(
                (handle) => handle.id === handleId,
            );
            if (index === -1) break;
            node.handles.splice(index, 1);
        }
        for (const edge of this.edges.values()) {
            if (
                edge.source.handleId !== handleId &&
                edge.target.handleId !== handleId
            )
                break;
            this.edges.delete(edge.id);
        }
        this._handleRegistry.delete(handleId);
    }

    getNode(id: string): Node | undefined {
        return this.nodes.get(id);
    }
    getEdge(id: string): Edge | undefined {
        return this.edges.get(id);
    }
    getHandle(id: string): { handle: Handle; nodeId: string } | undefined {
        return this._handleRegistry.get(id);
    }
}

