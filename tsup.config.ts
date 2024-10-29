import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.mts"],
  dts: true,
  sourcemap: true,
  format: ["esm", "cjs"],
  target: ["es2015"],
  cjsInterop: true,
});
