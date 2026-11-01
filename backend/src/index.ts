import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Lightweight request logging for /api routes
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  log(`Unhandled error (${status}): ${message}`, "error");
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

// In production, optionally serve the built frontend if it is copied next to the server.
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

const port = parseInt(process.env.PORT || "5000", 10);
app.listen(port, "0.0.0.0", () => {
  log(`serving on port ${port}`);
});
