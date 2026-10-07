const path = require("node:path");
const fs = require("node:fs");
const esbuild = require("esbuild");

function build() {
  const root = path.resolve(__dirname, "..");
  esbuild.buildSync({
    absWorkingDir: root,
    entryPoints: ["src/main.jsx"],
    bundle: true,
    outdir: "dist/assets",
    entryNames: "app",
    minify: true,
    sourcemap: true,
    preserveSymlinks: true,
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "info",
  });
  const html = fs
    .readFileSync(path.join(root, "index.html"), "utf8")
    .replace(
      '<script type="module" src="/src/main.jsx"></script>',
      '<link rel="stylesheet" href="/assets/app.css"/><script defer src="/assets/app.js"></script>',
    );
  fs.writeFileSync(path.join(root, "dist/index.html"), html);
  console.log("React production build ready in dist/.");
}

if (require.main === module) build();
module.exports = { build };
