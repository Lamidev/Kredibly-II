import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Kredibly II API Engine is online and operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
