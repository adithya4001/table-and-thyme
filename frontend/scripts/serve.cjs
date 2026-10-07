const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const build = () => require("./build.cjs").build();

const preview = process.argv.includes("--preview");
const port = Number(process.env.FRONTEND_PORT || (preview ? 4173 : 5173));
const backendPort = Number(process.env.BACKEND_PORT || 8080);
const root = path.resolve(__dirname, "../dist");
if (!preview) build();
if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("Run npm run build before preview.");
  process.exit(1);
}

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".map": "application/json",
  ".svg": "image/svg+xml",
};
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    const upstream = http.request(
      {
        hostname: "127.0.0.1",
        port: backendPort,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${backendPort}` },
        timeout: 25000,
      },
      (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
      },
    );
    upstream.on("timeout", () =>
      upstream.destroy(new Error("Backend timeout")),
    );
    upstream.on("error", () => {
      if (!res.headersSent)
        res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Spring Boot is unavailable. Start the backend and retry.",
        }),
      );
    });
    req.pipe(upstream);
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  const file = path.resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});
server.on("error", (error) => {
  console.error(`Cannot start frontend: ${error.message}`);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Table & Thyme: http://127.0.0.1:${port} (API → Spring Boot :${backendPort})`,
  ),
);
if (!preview) {
  let timer;
  fs.watch(path.resolve(__dirname, "../src"), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
        console.log("Rebuilt. Refresh your browser.");
      } catch (error) {
        console.error(error.message);
      }
    }, 300);
  });
}
