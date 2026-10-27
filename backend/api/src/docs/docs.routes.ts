/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — INTERACTIVE OPENAPI / SWAGGER UI ROUTER (DAY 26)
 * ═══════════════════════════════════════════════════════════════════════════
 * Serves live interactive Swagger UI and ReDoc documentation for all 200+
 * REST API endpoints with zero external npm build dependencies.
 *
 * Endpoints:
 * - GET /api/docs              -> Interactive Swagger UI Explorer
 * - GET /api/docs/openapi.json -> Raw OpenAPI 3.0.3 JSON Specification
 * - GET /api/docs/redoc        -> Clean ReDoc Medical Documentation UI
 * - GET /api/docs/summary      -> API Metrics Summary & Tag Catalog
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Router, Request, Response } from "express";
import { OPENAPI_SPECIFICATION } from "./openapi.spec";

const router = Router();

/**
 * GET /api/docs/openapi.json
 * Returns raw OpenAPI 3.0.3 specification JSON.
 */
router.get("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(OPENAPI_SPECIFICATION);
});

/**
 * GET /api/docs/summary
 * Returns endpoint counts, module count, and compliance certification metadata.
 */
router.get("/summary", (_req: Request, res: Response) => {
  const pathKeys = Object.keys(OPENAPI_SPECIFICATION.paths);
  let totalOperations = 0;
  pathKeys.forEach((p) => {
    totalOperations += Object.keys(OPENAPI_SPECIFICATION.paths[p]).length;
  });

  res.json({
    success: true,
    title: OPENAPI_SPECIFICATION.info.title,
    version: OPENAPI_SPECIFICATION.info.version,
    openApiVersion: OPENAPI_SPECIFICATION.openapi,
    totalPaths: pathKeys.length,
    totalOperations,
    totalTags: OPENAPI_SPECIFICATION.tags.length,
    tags: OPENAPI_SPECIFICATION.tags.map((t) => t.name),
    certifications: [
      "NABL ISO 15189:2022",
      "ABDM / ABHA v0.5",
      "DPDP Act 2023",
      "GST SAC 999316",
      "OWASP Top 10",
    ],
  });
});

/**
 * GET /api/docs
 * Serves self-contained, interactive Swagger UI HTML.
 */
router.get("/", (_req: Request, res: Response) => {
  const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LabCore ELIS OS — Interactive API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.18.2/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body {
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .topbar-banner {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .topbar-banner h1 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge-pill {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #ffffff;
    }
    .swagger-ui {
      background: #ffffff;
      padding: 24px;
      border-radius: 12px;
      margin: 24px auto;
      max-width: 1400px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div class="topbar-banner">
    <h1>
      <span>🏥</span>
      <span>NIKIL-LABCORE-ELIS-OS — Enterprise REST API Documentation</span>
    </h1>
    <div style="display: flex; gap: 12px; align-items: center;">
      <span class="badge-pill">v3.0.0-PRODUCTION</span>
      <span class="badge-pill">NABL ISO 15189</span>
      <span class="badge-pill">ABDM M1/M2/M3</span>
      <a href="/api/docs/redoc" style="color: white; font-size: 0.8rem; font-weight: 600; text-decoration: underline;">Switch to ReDoc</a>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(swaggerHtml);
});

/**
 * GET /api/docs/redoc
 * Serves clean ReDoc documentation interface.
 */
router.get("/redoc", (_req: Request, res: Response) => {
  const redocHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>NIKIL-LABCORE-ELIS-OS — ReDoc API Reference</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <redoc spec-url='/api/docs/openapi.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(redocHtml);
});

export default router;
