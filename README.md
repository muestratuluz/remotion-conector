# Conector de Remotion para claude.ai

Servidor MCP remoto (HTTP) con la herramienta `remotion-documentation`,
que busca en la documentación oficial de Remotion.

## 1. Publicarlo (Render, gratis)

1. Sube esta carpeta a un repositorio de GitHub.
2. En https://render.com → **New → Web Service** → elige el repositorio.
3. Configuración:
   - Runtime: **Node**
   - Build command: `npm install`
   - Start command: `npm start`
4. Crea el servicio. Render te da una URL como `https://remotion-conector.onrender.com`.
5. Comprueba que al abrirla dice "Servidor MCP de Remotion activo".

(También funciona en Railway, Fly.io o cualquier hosting de Node con HTTPS.)

## 2. Añadirlo como conector

1. Ve a https://claude.ai/customize/connectors
2. **Añadir conector personalizado**
3. Nombre: `Remotion`
4. URL: `https://TU-URL.onrender.com/mcp` (con `/mcp` al final)
5. Guarda, y actívalo en el chat desde el menú de herramientas.

## Probarlo en local

```bash
npm install
npm start
```
