import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";

const router = Router();

const createPollSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  allowMultiple: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

const voteSchema = z.object({
  optionIndex: z.number().int().min(0),
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

router.post("/api/rooms/:roomId/polls", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    await assertMember(roomId, req.userId!);

    const body = createPollSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from("polls")
      .insert({
        room_id: roomId,
        user_id: req.userId,
        question: body.question,
        options: body.options,
        allow_multiple: body.allowMultiple,
        expires_at: body.expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/api/rooms/:roomId/polls/:pollId/vote",
  authenticate,
  async (req, res, next) => {
    try {
      const { roomId, pollId } = req.params;
      await assertMember(roomId, req.userId!);

      const body = voteSchema.parse(req.body);

      const { data: poll, error: pollError } = await supabaseAdmin
        .from("polls")
        .select("*")
        .eq("id", pollId)
        .eq("room_id", roomId)
        .single();

      if (pollError || !poll) throw new NotFoundError("Poll not found");

      if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
        throw new ForbiddenError("Poll has expired");
      }

      if (body.optionIndex >= poll.options.length) {
        throw new ForbiddenError("Invalid option index");
      }

      if (!poll.allow_multiple) {
        const { data: existingVote } = await supabaseAdmin
          .from("poll_votes")
          .select("id")
          .eq("poll_id", pollId)
          .eq("user_id", req.userId)
          .single();

        if (existingVote) {
          const { error: deleteError } = await supabaseAdmin
            .from("poll_votes")
            .delete()
            .eq("poll_id", pollId)
            .eq("user_id", req.userId);

          if (deleteError) throw deleteError;
        }
      } else {
        const { data: existingVote } = await supabaseAdmin
          .from("poll_votes")
          .select("id")
          .eq("poll_id", pollId)
          .eq("user_id", req.userId)
          .eq("option_index", body.optionIndex)
          .single();

        if (existingVote) {
          throw new ConflictError("Already voted for this option");
        }
      }

      const { data, error } = await supabaseAdmin
        .from("poll_votes")
        .insert({
          poll_id: pollId,
          user_id: req.userId,
          option_index: body.optionIndex,
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

router.get("/api/rooms/:roomId/polls", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    await assertMember(roomId, req.userId!);

    const { data, error } = await supabaseAdmin
      .from("polls")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
