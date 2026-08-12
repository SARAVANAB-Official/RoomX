import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { authenticate, authenticateOptional } from "../middleware/auth.js";
import { generateRoomId, generateRoomCode } from "../utils/ids.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../utils/errors.js";

const router = Router();

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  maxParticipants: z.coerce.number().int().min(2).max(100).default(50),
  isPrivate: z.boolean().default(false),
});

const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  maxParticipants: z.coerce.number().int().min(2).max(100).optional(),
  isPrivate: z.boolean().optional(),
});

router.post("/api/rooms", authenticate, async (req, res, next) => {
  try {
    const body = createRoomSchema.parse(req.body);
    const roomId = generateRoomId();
    const roomCode = generateRoomCode();

    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({
        id: roomId,
        code: roomCode,
        name: body.name,
        description: body.description || null,
        max_participants: body.maxParticipants,
        is_private: body.isPrivate,
        owner_id: req.userId,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("room_members").insert({
      room_id: roomId,
      user_id: req.userId,
      role: "owner",
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get("/api/rooms/:roomId", authenticateOptional, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (error || !data) throw new NotFoundError("Room not found");

    if (data.is_private && data.owner_id !== req.userId) {
      const { data: membership } = await supabaseAdmin
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", req.userId)
        .single();

      if (!membership) throw new ForbiddenError("Room is private");
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/api/rooms/:roomId/join", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !room) throw new NotFoundError("Room not found");

    if (room.is_locked) {
      const { data: existingMember } = await supabaseAdmin
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", req.userId)
        .single();

      if (!existingMember) {
        throw new ForbiddenError("Room is locked");
      }
    }

    const { count } = await supabaseAdmin
      .from("room_members")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (count && count >= room.max_participants) {
      throw new ConflictError("Room is full");
    }

    const { data: existingMember } = await supabaseAdmin
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", req.userId)
      .single();

    if (existingMember) {
      return res.json({ success: true, data: { message: "Already a member" } });
    }

    const { error } = await supabaseAdmin.from("room_members").insert({
      room_id: roomId,
      user_id: req.userId,
      role: "member",
    });

    if (error) throw error;

    res.status(201).json({ success: true, data: { message: "Joined room" } });
  } catch (err) {
    next(err);
  }
});

router.post("/api/rooms/:roomId/leave", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const { data: member, error: memberError } = await supabaseAdmin
      .from("room_members")
      .select("id, role")
      .eq("room_id", roomId)
      .eq("user_id", req.userId)
      .single();

    if (memberError || !member) throw new NotFoundError("Not a member of this room");

    if (member.role === "owner") {
      throw new ForbiddenError("Owner cannot leave room. Transfer ownership first.");
    }

    const { error } = await supabaseAdmin
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", req.userId);

    if (error) throw error;

    res.json({ success: true, data: { message: "Left room" } });
  } catch (err) {
    next(err);
  }
});

router.get("/api/rooms/:roomId/members", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const { data: membership } = await supabaseAdmin
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", req.userId)
      .single();

    if (!membership) throw new ForbiddenError("Not a member of this room");

    const { data, error } = await supabaseAdmin
      .from("room_members")
      .select("*")
      .eq("room_id", roomId);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/api/rooms/:roomId/settings",
  authenticate,
  async (req, res, next) => {
    try {
      const { roomId } = req.params;
      const body = updateSettingsSchema.parse(req.body);

      const { data: member, error: memberError } = await supabaseAdmin
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", req.userId)
        .single();

      if (memberError || !member) throw new NotFoundError("Not a member");
      if (member.role !== "owner") throw new ForbiddenError("Only owner can update settings");

      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.maxParticipants !== undefined) updates.max_participants = body.maxParticipants;
      if (body.isPrivate !== undefined) updates.is_private = body.isPrivate;

      const { data, error } = await supabaseAdmin
        .from("rooms")
        .update(updates)
        .eq("id", roomId)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/api/rooms/:roomId/lock", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const { data: member } = await supabaseAdmin
      .from("room_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", req.userId)
      .single();

    if (!member || (member.role !== "owner" && member.role !== "moderator")) {
      throw new ForbiddenError("Only owner or moderator can lock rooms");
    }

    const { error } = await supabaseAdmin
      .from("rooms")
      .update({ is_locked: true })
      .eq("id", roomId);

    if (error) throw error;

    res.json({ success: true, data: { message: "Room locked" } });
  } catch (err) {
    next(err);
  }
});

router.post("/api/rooms/:roomId/unlock", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const { data: member } = await supabaseAdmin
      .from("room_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", req.userId)
      .single();

    if (!member || (member.role !== "owner" && member.role !== "moderator")) {
      throw new ForbiddenError("Only owner or moderator can unlock rooms");
    }

    const { error } = await supabaseAdmin
      .from("rooms")
      .update({ is_locked: false })
      .eq("id", roomId);

    if (error) throw error;

    res.json({ success: true, data: { message: "Room unlocked" } });
  } catch (err) {
    next(err);
  }
});

export default router;
