import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

router.get("/health", async (_req, res) => {
  let dbOk = true;
  try {
    const { error } = await supabaseAdmin
      .from("rooms")
      .select("id")
      .limit(1);
    if (error) dbOk = false;
  } catch {
    dbOk = false;
  }

  res.json({
    success: true,
    data: {
      status: dbOk ? "healthy" : "degraded",
      uptime: process.uptime(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: dbOk ? "connected" : "disconnected",
    },
  });
});

export default router;
