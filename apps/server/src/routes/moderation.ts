import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

const router = Router();

async function assertModerator(
  roomId: string,
  userId: string
): Promise<{ role: string }> {
  const { data: member, error } = await supabaseAdmin
    .from("room_members")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();

  if (error || !member) throw new ForbiddenError("Not a member of this room");
  if (member.role !== "owner" && member.role !== "moderator") {
    throw new ForbiddenError("Moderator or owner role required");
  }
  return member;
}

const userActionSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

router.post(
  "/api/rooms/:roomId/moderation/kick",
  authenticate,
  async (req, res, next) => {
    try {
      const { roomId } = req.params;
      await assertModerator(roomId, req.userId!);
      const body = userActionSchema.parse(req.body);

      if (body.targetUserId === req.userId) {
        throw new ForbiddenError("Cannot kick yourself");
      }

      const { data: target } = await supabaseAdmin
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", body.targetUserId)
        .single();

      if (!target) throw new NotFoundError("User not in room");
      if (target.role === "owner") throw new ForbiddenError("Cannot kick the owner");

      const { error } = await supabaseAdmin
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", body.targetUserId);

      if (error) throw error;

      res.json({
        success: true,
        data: { message: "User kicked", reason: body.reason },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/api/rooms/:roomId/moderation/ban",
  authenticate,
  async (req, res, next) => {
    try {
      const { roomId } = req.params;
      await assertModerator(roomId, req.userId!);
      const body = userActionSchema.parse(req.body);

      if (body.targetUserId === req.userId) {
        throw new ForbiddenError("Cannot ban yourself");
      }

      const { data: target } = await supabaseAdmin
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", body.targetUserId)
        .single();

      if (!target) throw new NotFoundError("User not in room");
      if (target.role === "owner") throw new ForbiddenError("Cannot ban the owner");

      const { error: deleteError } = await supabaseAdmin
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", body.targetUserId);

      if (deleteError) throw deleteError;

      const { error: banError } = await supabaseAdmin.from("bans").insert({
        room_id: roomId,
        user_id: body.targetUserId,
        banned_by: req.userId,
        reason: body.reason || null,
      });

      if (banError) throw banError;

      res.json({
        success: true,
        data: { message: "User banned", reason: body.reason },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/api/rooms/:roomId/moderation/mute",
  authenticate,
  async (req, res, next) => {
    try {
      const { roomId } = req.params;
      await assertModerator(roomId, req.userId!);
      const body = userActionSchema.parse(req.body);

      if (body.targetUserId === req.userId) {
        throw new ForbiddenError("Cannot mute yourself");
      }

      const { data: target } = await supabaseAdmin
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", body.targetUserId)
        .single();

      if (!target) throw new NotFoundError("User not in room");

      const { error } = await supabaseAdmin
        .from("room_members")
        .update({ is_muted: true })
        .eq("room_id", roomId)
        .eq("user_id", body.targetUserId);

      if (error) throw error;

      res.json({
        success: true,
        data: { message: "User muted", reason: body.reason },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/api/rooms/:roomId/moderation/unban",
  authenticate,
  async (req, res, next) => {
    try {
      const { roomId } = req.params;
      await assertModerator(roomId, req.userId!);
      const body = userActionSchema.parse(req.body);

      const { error } = await supabaseAdmin
        .from("bans")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", body.targetUserId);

      if (error) throw error;

      res.json({ success: true, data: { message: "User unbanned" } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
