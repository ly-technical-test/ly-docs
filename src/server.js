const { Hono } = require("hono");
const { cors } = require("hono/cors");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const PORT = process.env.API_PORT;
const BASE_PATH = `/${process.env.APP_NAME}`;
const SPECS_DIR = path.join(__dirname, "../microservices");

async function startMockServer() {
  const yamlFiles = fs.readdirSync(SPECS_DIR).filter((file) => file.endsWith(".yaml"));

  if (yamlFiles.length === 0) {
    console.error(`No YAML files found in ${SPECS_DIR}`);
    process.exit(1);
  }

  console.log(`Found ${yamlFiles.length} OpenAPI spec(s):`);
  yamlFiles.forEach((file) => console.log(`  - ${file}`));

  const app = new Hono();

  app.use("*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }));

  const specsByFile = {};

  for (const yamlFile of yamlFiles) {
    const specPath = path.join(SPECS_DIR, yamlFile);
    const specContent = fs.readFileSync(specPath, "utf-8");
    const spec = yaml.load(specContent);

    specsByFile[yamlFile] = { content: specContent, spec };

    console.log(`\nLoading routes from ${yamlFile}...`);

    if (!spec.paths) continue;

    for (const [pathPattern, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!["get", "post", "put", "delete", "patch"].includes(method)) continue;

        const responses = operation.responses || {};

        app[method](pathPattern, async (c) => {
          const contentLengthHeader = c.req.header("content-length");
          const contentLength = Number(contentLengthHeader);
          const canHaveBody = ["post", "put", "patch", "delete"].includes(method);

          if (canHaveBody && (!contentLengthHeader || contentLength > 0)) {
            try {
              await c.req.json();
            } catch {
              const mockResponse = responses["400"]?.content?.["application/json"]?.example || {
                success: false,
                message: "Invalid JSON",
              };
              return c.json(mockResponse, 400);
            }
          }

          const successResponse = responses["200"] || responses["201"] || responses["default"];
          let mockResponse = { success: true, data: { message: "Mock response" } };

          if (successResponse?.content?.["application/json"]?.example) {
            mockResponse = successResponse.content["application/json"].example;
          } else if (successResponse?.content?.["application/json"]?.examples?.valid?.value) {
            mockResponse = successResponse.content["application/json"].examples.valid.value;
          }

          return c.json(mockResponse);
        });
      }
    }
  }

  app.get("/spec.yaml", (c) => {
    const requested = c.req.query("spec");
    const selectedFile = requested && specsByFile[requested] ? requested : yamlFiles[0];
    return c.text(specsByFile[selectedFile].content, 200, {
      "Content-Type": "application/x-yaml",
    });
  });

  app.get("/docs", (c) => {
    const requested = c.req.query("spec");
    const selectedFile = requested && specsByFile[requested] ? requested : yamlFiles[0];
    const selectedTitle = specsByFile[selectedFile]?.spec?.info?.title || "API Documentation";
    const optionsHtml = yamlFiles
      .map((f) => `<option value="${f}"${f === selectedFile ? " selected" : ""}>${f}</option>`)
      .join("");

    const html = `
<!doctype html>
<html>
  <head>
    <title>${selectedTitle}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div style="padding: 12px; display: flex; gap: 8px; align-items: center; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
      <label for="spec" style="font-weight: 600; color: white;">Microserviço</label>
      <select id="spec" style="padding: 6px 8px;" onchange="location.href='${BASE_PATH}/docs?spec=' + encodeURIComponent(this.value)">
        ${optionsHtml}
      </select>
    </div>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        spec: {
          url: '${BASE_PATH}/spec.yaml?spec=${encodeURIComponent(selectedFile)}',
        },
      })
    </script>
  </body>
</html>`;
    return c.html(html);
  });

  const { serve } = await import("@hono/node-server");

  serve({ fetch: app.fetch, port: PORT });
  console.log(`ly-docs running on port ${PORT}`);
}

startMockServer().catch(console.error);
