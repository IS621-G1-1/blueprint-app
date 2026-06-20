import { config } from "dotenv";
import { resolve } from "node:path";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import semesterPlanRoutes from "./routes/semesterPlan.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import { register, httpRequestCount, httpRequestDuration } from "./lib/metrics.js";

config();
config({ path: resolve(process.cwd(), "../.env") });

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGINS = new Set(
  (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

CLIENT_ORIGINS.add("http://127.0.0.1:5173");
CLIENT_ORIGINS.add("http://[::1]:5173");

// Metrics middleware — record every request
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route = req.route?.path ?? req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestCount.inc(labels);
    end(labels);
  });
  next();
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CLIENT_ORIGINS.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Routes
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/auth", authRoutes);
app.use("/modules", moduleRoutes);
app.use("/semester-plans", semesterPlanRoutes);
app.use("/watchlist", watchlistRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
