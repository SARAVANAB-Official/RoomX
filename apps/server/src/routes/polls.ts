import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";

const router = Router();

const createPollSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  isAnonymous: z.boolean().default(false),
});

const voteSchema = z.object({
  optionId: z.string().uuid(),
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

    const { data: poll, error: pollError } = await supabaseAdmin
      .from("polls")
      .insert({
        room_id: roomId,
        user_id: req.userId,
        question: body.question,
        is_anonymous: body.isAnonymous,
        status: "active",
      })
      .select()
      .single();

    if (pollError) throw pollError;

    const optionsToInsert = body.options.map((text, index) => ({
      poll_id: poll.id,
      text,
      position: index,
    }));

    const { data: options, error: optionsError } = await supabaseAdmin
      .from("poll_options")
      .insert(optionsToInsert)
      .select();

    if (optionsError) throw optionsError;

    res.status(201).json({
      success: true,
      data: { ...poll, options },
    });
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

      if (poll.status === "closed") {
        throw new ForbiddenError("Poll is closed");
      }

      const { data: option, error: optionError } = await supabaseAdmin
        .from("poll_options")
        .select("id")
        .eq("id", body.optionId)
        .eq("poll_id", pollId)
        .single();

      if (optionError || !option) throw new NotFoundError("Invalid option");

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
          .eq("id", existingVote.id);

        if (deleteError) throw deleteError;
      }

      const { data: vote, error: voteError } = await supabaseAdmin
        .from("poll_votes")
        .insert({
          poll_id: pollId,
          option_id: body.optionId,
          user_id: req.userId,
        })
        .select()
        .single();

      if (voteError) throw voteError;

      res.status(201).json({ success: true, data: vote });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/api/rooms/:roomId/polls", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    await assertMember(roomId, req.userId!);

    const { data: polls, error } = await supabaseAdmin
      .from("polls")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const pollIds = (polls || []).map((p: any) => p.id);

    let optionsMap: Record<string, any[]> = {};
    let votesMap: Record<string, any[]> = {};

    if (pollIds.length > 0) {
      const { data: allOptions } = await supabaseAdmin
        .from("poll_options")
        .select("*")
        .in("poll_id", pollIds)
        .order("position");

      if (allOptions) {
        for (const opt of allOptions) {
          if (!optionsMap[opt.poll_id]) optionsMap[opt.poll_id] = [];
          optionsMap[opt.poll_id].push(opt);
        }
      }

      const { data: allVotes } = await supabaseAdmin
        .from("poll_votes")
        .select("*")
        .in("poll_id", pollIds);

      if (allVotes) {
        for (const vote of allVotes) {
          if (!votesMap[vote.poll_id]) votesMap[vote.poll_id] = [];
          votesMap[vote.poll_id].push(vote);
        }
      }
    }

    const enriched = (polls || []).map((poll: any) => ({
      ...poll,
      options: (optionsMap[poll.id] || []).map((opt: any) => ({
        ...opt,
        voteCount: (votesMap[poll.id] || []).filter((v: any) => v.option_id === opt.id).length,
      })),
      totalVotes: (votesMap[poll.id] || []).length,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

export default router;
