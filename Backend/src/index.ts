import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { ENV } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Security & Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving for uploads (direct fallback if not served by Nginx)
app.use("/uploads", express.static(path.resolve(ENV.UPLOAD_DIR)));

// API Routes aggregator
app.use("/api", apiRoutes);

// Centralized error handling
app.use(errorHandler);

// Server listener
const PORT = ENV.PORT;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Kredibly II API running on port ${PORT}`);
  console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
  console.log(`🏥 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
