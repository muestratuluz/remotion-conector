// Servidor MCP remoto para Remotion (Streamable HTTP, sin estado).
// Expone la misma herramienta que el paquete oficial @remotion/mcp,
// pero por HTTPS para que claude.ai pueda usarlo como conector.
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as z from "zod/v4";

const PORT = Number(process.env.PORT) || 3000;
const DOCS_URL = "https://mcp.remotion.dev/mcp/67cad4626afeae106c6ffb50";

function buildServer() {
  const server = new McpServer({ name: "remotion", version: "1.0.0" });
  server.registerTool(
    "remotion-documentation",
    {
      title: "Buscar en la documentación de Remotion",
      description:
        "Busca en la documentación oficial de Remotion (crear videos con React). Usa consultas cortas.",
      inputSchema: { query: z.string().describe("Lo que quieres buscar, corto y concreto") },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ query }) => {
      try {
        const res = await fetch(`${DOCS_URL}?query=${encodeURIComponent(query)}`, {
          signal: AbortSignal.timeout(15000),
        });
        const text = await res.text();
        if (!res.ok) {
          return { isError: true, content: [{ type: "text", text: `Error ${res.status}: ${text}` }] };
        }
        return { content: [{ type: "text", text }] };
      } catch (err) {
        return { isError: true, content: [{ type: "text", text: `No se pudo consultar la documentación: ${err.message}` }] };
      }
    },
  );
  return server;
}

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Servidor MCP de Remotion activo. URL del conector: /mcp\n");
  }

  if (url.pathname !== "/mcp") {
    res.writeHead(404).end();
    return;
  }

  if (req.method !== "POST") {
    // Modo sin estado: no hay stream GET ni sesiones que cerrar.
    res.writeHead(405, { allow: "POST" }).end();
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { "content-type": "application/json" });
    return res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "JSON inválido" }, id: null }));
  }

  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, parsed);
});

httpServer.listen(PORT, () => {
  console.log(`Servidor MCP de Remotion escuchando en http://localhost:${PORT}/mcp`);
});
