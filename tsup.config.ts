import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.mjs"],
  sourcemap: true,
  format: ["esm", "cjs"],
  target: ["es2015"],
  cjsInterop: true,
});
