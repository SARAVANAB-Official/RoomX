import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "../lib/supabase.js";
import { config } from "../config/index.js";
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
  displayName: z.string().min(1).max(50).optional(),
  maxParticipants: z.coerce.number().int().min(2).max(100).default(50),
  isPrivate: z.boolean().default(false),
});

const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  maxParticipants: z.coerce.number().int().min(2).max(100).optional(),
  isPrivate: z.boolean().optional(),
});

router.post("/api/rooms", authenticateOptional, async (req, res, next) => {
  try {
    const body = createRoomSchema.parse(req.body);
    const roomId = generateRoomId();
    const roomCode = generateRoomCode();

    let userId = req.userId;
    let guestToken: string | undefined;

    if (!userId) {
      const displayName = body.displayName || "Guest";
      userId = uuidv4();

      await supabaseAdmin.from("users").upsert({
        id: userId,
        display_name: displayName,
        is_guest: true,
      }, { onConflict: "id" });

      guestToken = jwt.sign(
        { userId, displayName, isGuest: true },
        config.jwtSecret,
        { expiresIn: "24h" }
      );
    } else {
      await supabaseAdmin.from("users").upsert({
        id: userId,
        display_name: req.authPayload?.email || "User",
        is_guest: req.authPayload?.isGuest || false,
      }, { onConflict: "id" });
    }

    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({
        id: roomId,
        room_code: roomCode,
        name: body.name,
        privacy: body.isPrivate ? "private" : "public",
        max_participants: body.maxParticipants,
        owner_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("room_members").insert({
      room_id: roomId,
      user_id: userId,
      role: "owner",
    });

    const responseData: Record<string, unknown> = {
      id: data.id,
      roomCode: data.room_code,
      name: data.name,
      privacy: data.privacy,
      maxParticipants: data.max_participants,
      ownerId: data.owner_id,
      createdAt: data.created_at,
    };

    if (guestToken) {
      responseData.userId = userId;
      responseData.guestToken = guestToken;
    }

    const response = { success: true, data: responseData };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

router.get("/api/rooms/mine", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("room_members")
      .select("rooms(*)")
      .eq("user_id", req.userId);

    if (error) throw error;

    const rooms = (data || []).map((m: any) => m.rooms).filter(Boolean);
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
});

router.get("/api/rooms/:roomId", authenticateOptional, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const { data: room, error } = await supabaseAdmin
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (error || !room) throw new NotFoundError("Room not found");

    if (room.privacy === "private" && room.owner_id !== req.userId) {
      const { data: membership } = await supabaseAdmin
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", req.userId || "")
        .single();

      if (!membership) throw new ForbiddenError("Room is private");
    }

    const { data: members } = await supabaseAdmin
      .from("room_members")
      .select("id, room_id, user_id, role, is_muted, is_banned, joined_at")
      .eq("room_id", roomId);

    const shaped = {
      id: room.id,
      name: room.name,
      description: room.description || null,
      privacy: room.privacy?.toUpperCase() || "PUBLIC",
      settings: {
        password: room.password || null,
        maxParticipants: room.max_participants || 50,
        allowScreenShare: room.allow_screen_share !== false,
        allowFileShare: room.allow_file_share !== false,
        allowChat: room.allow_chat !== false,
        allowCamera: room.allow_camera !== false,
        allowMicrophone: room.allow_microphone !== false,
        allowBrowserSync: room.allow_browser_sync !== false,
        allowGuests: room.allow_guests !== false,
        waitingRoom: room.waiting_room || false,
        multiplePresenters: room.multiple_presenters !== false,
        isLocked: room.is_locked || false,
      },
      ownerId: room.owner_id,
      owner: null,
      members: (members || []).map((m: any) => ({
        id: m.id,
        roomId: m.room_id,
        userId: m.user_id,
        user: null,
        role: m.role,
        isMuted: m.is_muted || false,
        isCameraOn: false,
        isScreenSharing: false,
        isHandRaised: false,
        joinedAt: m.joined_at,
        leftAt: null,
      })),
      memberCount: (members || []).length,
      isActive: (members || []).length > 0,
      createdAt: room.created_at,
      updatedAt: room.updated_at || room.created_at,
      lastActiveAt: room.last_active_at || room.updated_at || room.created_at,
    };

    res.json({ success: true, data: shaped });
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
      if (body.maxParticipants !== undefined) updates.max_participants = body.maxParticipants;
      if (body.isPrivate !== undefined) updates.privacy = body.isPrivate ? "private" : "public";

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
