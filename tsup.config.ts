import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.mjs"],
  sourcemap: true,
  format: ["esm"],
  target: ["node18"]
});
