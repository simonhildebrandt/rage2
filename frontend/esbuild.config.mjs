import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outdir: "dist",
  format: "esm",
  splitting: true,
  jsx: "automatic",
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": watch ? '"development"' : '"production"',
    "import.meta.env.API_BASE": '"http://localhost:8787"',
  },
  loader: { ".tsx": "tsx", ".ts": "ts" },
});

if (watch) {
  await ctx.watch();
  const { host, port } = await ctx.serve({
    servedir: ".",
    fallback: "public/index.html",
    port: 3000,
  });
  console.log(`Listening on http://${host}:${port}`);
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
