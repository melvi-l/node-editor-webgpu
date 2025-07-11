import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    base: "/node-editor-webgpu/",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
});
