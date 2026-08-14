import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimiter.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

const router = Router();

const getMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  before: z.string().uuid().optional(),
});

const postMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

async function assertMember(roomId: string, userId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();
  if (!data) throw new ForbiddenError("Not a member of this room");
}

router.get("/api/rooms/:roomId/messages", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    await assertMember(roomId, req.userId!);

    const query = getMessagesSchema.parse(req.query);

    let dbQuery = supabaseAdmin
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (query.before) {
      const { data: beforeMsg } = await supabaseAdmin
        .from("messages")
        .select("created_at")
        .eq("id", query.before)
        .single();

      if (beforeMsg) {
        dbQuery = dbQuery.lt("created_at", beforeMsg.created_at);
      }
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    res.json({ success: true, data: data.reverse() });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/api/rooms/:roomId/messages",
  authenticate,
  chatLimiter,
  async (req, res, next) => {
    try {
      const { roomId } = req.params;
      await assertMember(roomId, req.userId!);

      const body = postMessageSchema.parse(req.body);

      const { data, error } = await supabaseAdmin
        .from("messages")
        .insert({
          room_id: roomId,
          user_id: req.userId,
          content: body.content,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
