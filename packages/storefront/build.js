import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/bundle.js",
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ["es2018"],
  format: "iife",
  globalName: "CodexBundle",
});
