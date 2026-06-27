import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outdir: "public/dist",
  format: "esm",
  splitting: true,
  jsx: "automatic",
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": watch ? '"development"' : '"production"',
    "import.meta.env.API_BASE": JSON.stringify(
      process.env.API_BASE ?? "http://localhost:8787",
    ),
    "import.meta.env.LWL_KEY": JSON.stringify(
      process.env.LWL_KEY ?? "6e9902ef-ecca-428e-8954-e18a737f4069",
    ),
  },
  loader: { ".tsx": "tsx", ".ts": "ts" },
});

if (watch) {
  await ctx.watch();
  console.log("Watching for changes…");
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
