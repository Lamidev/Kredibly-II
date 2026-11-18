import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { ENV } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.set("trust proxy", 1);

// Security & Parsing Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: [
      ENV.FRONTEND_URL,
      "https://usekredibly.com",
      "https://www.usekredibly.com",
      "https://kredibly.shop",
      "https://www.kredibly.shop",
      /^https:\/\/[a-z0-9-]+\.kredibly\.shop$/,
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "10mb",
    verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving for uploads (with nosniff header)
app.use(
  "/uploads",
  express.static(path.resolve(ENV.UPLOAD_DIR), {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

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
