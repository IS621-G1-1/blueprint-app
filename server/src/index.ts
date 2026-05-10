import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import meRoutes from "./routes/me.routes.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

app.use("/health", healthRoutes);
app.use("/me", meRoutes);

// Final error handler. JWT errors from express-oauth2-jwt-bearer surface as 401 with
// a sensible message; other errors get a generic 500 to avoid leaking internals.
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
