type Type = "node" | "edge" | "handle";

export const id = (type: Type) => `${type}-${crypto.randomUUID()}`;

export const getType = (id: string): Type | null => {
    if (id.startsWith("node-")) return "node";
    if (id.startsWith("edge-")) return "edge";
    if (id.startsWith("handle-")) return "handle";
    return null;
};
