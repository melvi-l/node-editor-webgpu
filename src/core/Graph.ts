import { Vec2 } from "@/utils/math";
import Edge, { EdgeArgs } from "./Edge";
import Handle, { HandleArgs } from "./Handle";
import Node, { NodeArgs } from "./Node";
import { getType } from "@/utils/id";

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
        this.nodes.forEach((node) => node.updateHandlesPosition());
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

    addNode(node: Node | NodeArgs): Node {
        const _node = node instanceof Node ? node : new Node(node);

        if (this.nodes.has(_node.id))
            throw new Error(`Node ${_node.id} already exists.`);

        this.nodes.set(_node.id, _node);
        return _node;
    }
    addEdge(edge: Edge | EdgeArgs): Edge {
        const _edge = edge instanceof Edge ? edge : new Edge(edge);

        if (this.edges.has(_edge.id))
            throw new Error(`Edge ${_edge.id} already exists.`);

        this.edges.set(_edge.id, _edge);
        return _edge;
    }
    addHandle(nodeId: string, handle: Handle | HandleArgs): Handle {
        const _handle = handle instanceof Handle ? handle : new Handle(handle);

        if (this._handleRegistry.has(_handle.id))
            throw new Error(`Edge ${_handle.id} already exists.`);

        const node = this.getNode(nodeId);
        if (!node) throw new Error(`Node ${nodeId} not found`);
        node.handles.push(_handle);
        node.updateHandlesPosition();

        this._handleRegistry.set(_handle.id, {
            handle: _handle,
            nodeId,
        });
        return _handle;
    }

    moveNode(nodeId: string, newPosition: Vec2) {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node ${nodeId} not found`);
        node.position = [...newPosition]; // might be in place later on
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
            node.updateHandlesPosition();
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
    getElement(id: string): Node | Edge | Handle | undefined {
        const type = getType(id);
        if (type === "node") return this.getNode(id);
        if (type === "edge") return this.getEdge(id);
        if (type === "handle") return this.getHandle(id)?.handle;
        return undefined;
    }
    getAllNode(): MapIterator<Node> {
        return this.nodes.values();
    }
    getAllEdge(): MapIterator<Edge> {
        return this.edges.values();
    }
    getAllHandle(): MapIterator<{ handle: Handle; nodeId: string }> {
        return this._handleRegistry.values();
    }
}
