const http = require("http");
const httpProxy = require("http-proxy");

const TARGET = "http://127.0.0.1:9000";
const PORT = 9001;

const proxy = httpProxy.createProxyServer({ target: TARGET });

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers.origin || "no-origin"}`);
  proxy.web(req, res, {}, (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy en http://localhost:${PORT} → ${TARGET}`);
});
