import { add, scale, Vec2 } from "@/utils/math";
import Edge, { EdgeArgs } from "./Edge";
import Handle, { HandleArgs } from "./Handle";
import Node, { NodeArgs } from "./Node";
import { getType } from "@/utils/id";
import SelectionZone from "./SelectionZone";

type DirtyState = {
    selection: boolean;
    global: boolean;
    nodes: Set<string>; // maybe switch to weakset
    handles: Set<string>;
    edges: Set<string>;
};

export default class Graph {
    selectionZone: SelectionZone | null = null;
    nodes = new Map<string, Node>();
    edges = new Map<string, Edge>();
    private _handleRegistry = new Map<
        string,
        { handle: Handle; nodeId: string }
    >(); // handle in node -> registry for getting nodeId from handleId
    private _edgeRegistry = new Map<string, string>(); // edge outside of node.handles -> registry for getting edgeId from handleId

    private _dirty: DirtyState = {
        selection: false,
        global: false,
        nodes: new Set(),
        handles: new Set(),
        edges: new Set(),
    };

    constructor() { }

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

        this._dirty.global = true;
    }

    addNode(node: Node | NodeArgs): Node {
        const _node = node instanceof Node ? node : new Node(node);

        if (this.nodes.has(_node.id))
            throw new Error(`Node ${_node.id} already exists.`);

        this.nodes.set(_node.id, _node);

        this._dirty.global = true;

        return _node;
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

        this._dirty.global = true;
        return _handle;
    }
    addEdge(edge: Edge | EdgeArgs): Edge {
        const _edge = edge instanceof Edge ? edge : new Edge(edge);

        if (this.edges.has(_edge.id))
            throw new Error(`Edge ${_edge.id} already exists.`);

        this.edges.set(_edge.id, _edge);

        this._edgeRegistry.set(_edge.source.handleId, _edge.id);
        this._edgeRegistry.set(_edge.target.handleId, _edge.id);

        this._dirty.global = true;
        return _edge;
    }

    moveNode(node: Node, newPosition: Vec2) {
        node.position = [...newPosition]; // might be in place later on

        for (const handle of node.handles) {
            const edgeId = this._edgeRegistry.get(handle.id);
            if (edgeId == null) continue;

            this._dirty.edges.add(edgeId);
        }
        this._dirty.nodes.add(node.id);
    }

    removeNode(nodeId: string) {
        const node = this.getNode(nodeId);
        if (node != null) {
            for (const handle of node?.handles) {
                this.removeHandle(handle.id, node);
            }
        }

        this.nodes.delete(nodeId);
        this._dirty.global = true;
    }
    removeHandle(handleId: string, _node?: Node) {
        const node =
            _node ??
            (() => {
                const nodeId = this._handleRegistry.get(handleId)?.nodeId;
                if (nodeId == null) return;
                return this.getNode(nodeId);
            })();

        if (node != null) {
            node.handles = node.handles.filter((h) => h.id !== handleId);
            console.log(node.handles.filter((h) => h.id !== handleId));

            node.updateHandlesPosition();

            this._handleRegistry.delete(handleId);
        }

        const edgeId = this._edgeRegistry.get(handleId);
        if (edgeId != null) {
            this.removeEdge(edgeId);
        }

        this._dirty.global = true;
    }
    removeEdge(edgeId: string) {
        this.edges.delete(edgeId);

        const edge = this.getEdge(edgeId);
        if (edge) {
            this._edgeRegistry.delete(edge.source.handleId);
            this._edgeRegistry.delete(edge.target.handleId);
        }
        this.edges.delete(edgeId);

        this._dirty.global = true;
    }

    getNode(id: string): Node | undefined {
        return this.nodes.get(id);
    }
    getHandle(id: string): { handle: Handle; nodeId: string } | undefined {
        return this._handleRegistry.get(id);
    }
    getEdge(id: string): Edge | undefined {
        return this.edges.get(id);
    }
    getEdgeByHandleId(handleId: string): Edge | undefined {
        const edgeId = this._edgeRegistry.get(handleId);
        if (edgeId == null) return;
        return this.getEdge(edgeId);
    }
    getElement(id: string): Node | Edge | Handle | undefined {
        const type = getType(id);
        if (type === "node") return this.getNode(id);
        if (type === "edge") return this.getEdge(id);
        if (type === "handle") return this.getHandle(id)?.handle;
        return undefined;
    }
    get nodeCount(): number {
        return this.nodes.size;
    }
    get handleCount(): number {
        return this._handleRegistry.size;
    }
    get edgeCount(): number {
        return this.edges.size;
    }
    getAllNode(): MapIterator<Node> {
        return this.nodes.values();
    }
    getAllHandle(): MapIterator<{ handle: Handle; nodeId: string }> {
        return this._handleRegistry.values();
    }
    getAllEdge(): MapIterator<Edge> {
        return this.edges.values();
    }

    computeEdgeStartEnd(edge: Edge): [Vec2, Vec2] | undefined {
        const sourceNode = this.getNode(edge.source.nodeId);
        const sourceHandle = this.getHandle(edge.source.handleId)?.handle;

        if (sourceHandle == null || sourceNode == null) {
            console.warn(
                `Edge ${edge.id} referenced an unexistant ${sourceHandle == null ? "source handle" : "source node"}`,
            );
            return;
        }
        if (sourceHandle.position == null) {
            console.warn(
                `Unable to adapt for render edge ${edge.id} source handle ${sourceHandle.id}. Handle position should be compute before rendering`,
            );
            return;
        }
        const start = add(sourceNode.position, sourceHandle.position);

        const targetNode = this.getNode(edge.target.nodeId);
        const targetHandle = this.getHandle(edge.target.handleId)?.handle;

        if (targetHandle == null || targetNode == null) {
            console.warn(
                `Edge ${edge.id} referenced an unexistant ${targetHandle == null ? "target handle" : "target node"}`,
            );
            return;
        }
        if (targetHandle.position == null) {
            console.warn(
                `Unable to adapt for render edge ${edge.id} target handle ${targetHandle.id}. Handle position should be compute before rendering`,
            );
            return;
        }
        const end = add(targetNode.position, targetHandle.position);

        return [start, end];
    }
    get dirty(): DirtyState {
        return this._dirty;
    }
}
