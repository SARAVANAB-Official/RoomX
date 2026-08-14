import type { Server, Socket } from "socket.io";
import { z } from "zod";
import { supabaseAdmin } from "./supabase.js";
import { authenticateSocket } from "../middleware/auth.js";

interface SocketData {
  userId: string | null;
  roomId: string | null;
  displayName: string;
}

const connectedSockets = new Map<string, SocketData>();

const roomJoinSchema = z.object({ roomId: z.string().uuid() });
const webrtcSignalSchema = z.object({
  targetUserId: z.string().uuid(),
  offer: z.any().optional(),
  answer: z.any().optional(),
  candidate: z.any().optional(),
});
const iceCandidateSchema = z.object({
  targetUserId: z.string().uuid(),
  candidate: z.any(),
});
const mediaStateSchema = z.object({
  audioEnabled: z.boolean(),
  videoEnabled: z.boolean(),
});
const chatMessageSchema = z.object({ content: z.string().min(1).max(5000) });
const chatTypingSchema = z.object({ isTyping: z.boolean() });
const chatReactionSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().max(10),
});
const browserNavigateSchema = z.object({ url: z.string().url() });
const browserTabSchema = z.object({
  tabId: z.string().uuid(),
  url: z.string().url().optional(),
  title: z.string().optional(),
});
const pollCreateSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
});
const pollVoteSchema = z.object({
  pollId: z.string().uuid(),
  optionIndex: z.number().int().min(0),
});
const presenterSchema = z.object({ targetUserId: z.string().uuid() });
const moderationSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});
const reactionSchema = z.object({ emoji: z.string().max(10) });

async function assertRoomMembership(
  roomId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

function getRoomSockets(io: Server, roomId: string): string[] {
  const sockets: string[] = [];
  for (const [socketId, data] of connectedSockets.entries()) {
    if (data.roomId === roomId) sockets.push(socketId);
  }
  return sockets;
}

function getUserSocketId(roomId: string, userId: string): string | null {
  for (const [socketId, data] of connectedSockets.entries()) {
    if (data.roomId === roomId && data.userId === userId) return socketId;
  }
  return null;
}

export function setupSocketHandlers(io: Server): void {
  io.on("connection", async (socket: Socket) => {
    const authPayload = await authenticateSocket(
      socket.handshake.auth as Record<string, unknown>
    );

    const userId = authPayload?.userId || null;
    const displayName =
      (socket.handshake.auth.displayName as string) ||
      (userId ? `User-${userId.slice(0, 6)}` : `Guest-${socket.id.slice(0, 6)}`);

    connectedSockets.set(socket.id, {
      userId,
      roomId: null,
      displayName,
    });

    const tokenPresent = !!(socket.handshake.auth as any)?.token;
    const tokenValid = !!authPayload?.userId;
    console.log(
      `Socket connected: ${socket.id} (user: ${userId || "guest"}, name: ${displayName}, tokenPresent: ${tokenPresent}, tokenValid: ${tokenValid})`
    );

    socket.on("room:join", async (payload, callback) => {
      try {
        const { roomId } = roomJoinSchema.parse(payload);

        if (userId) {
          const isMember = await assertRoomMembership(roomId, userId);
          if (!isMember) {
            return callback?.({
              success: false,
              error: "Not a member of this room",
            });
          }
        }

        const { data: room } = await supabaseAdmin
          .from("rooms")
          .select("is_locked")
          .eq("id", roomId)
          .single();

        if (room?.is_locked && userId) {
          const { data: member } = await supabaseAdmin
            .from("room_members")
            .select("id")
            .eq("room_id", roomId)
            .eq("user_id", userId)
            .single();

          if (!member) {
            return callback?.({
              success: false,
              error: "Room is locked",
            });
          }
        }

        const prevRoomId = connectedSockets.get(socket.id)?.roomId;
        if (prevRoomId) {
          socket.leave(prevRoomId);
          io.to(prevRoomId).emit("user:left", {
            userId,
            socketId: socket.id,
            displayName,
          });
        }

        socket.join(roomId);
        connectedSockets.get(socket.id)!.roomId = roomId;

        const roomSockets = getRoomSockets(io, roomId);
        const members = roomSockets
          .map((sid) => ({
            socketId: sid,
            userId: connectedSockets.get(sid)?.userId,
            displayName: connectedSockets.get(sid)?.displayName,
          }));

        const selfIndex = members.findIndex((m) => m.socketId === socket.id);
        const others = selfIndex >= 0 ? members.filter((_, i) => i !== selfIndex) : members;

        others.forEach((m) => {
          io.to(m.socketId!).emit("room:member-joined", {
            member: {
              socketId: socket.id,
              userId,
              displayName,
              user: { id: userId, displayName },
            },
          });
        });

        socket.emit("room:state", {
          roomId,
          members: members.map((m) => ({
            socketId: m.socketId,
            userId: m.userId,
            displayName: m.displayName,
            user: m.userId ? { id: m.userId, displayName: m.displayName } : null,
          })),
        });

        callback?.({ success: true, data: { members: others, roomId } });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("room:leave", async (_payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const roomId = data.roomId;
        socket.leave(roomId);
        data.roomId = null;

        io.to(roomId).emit("user:left", {
          userId,
          socketId: socket.id,
          displayName,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("room:state", async (_payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const roomSockets = getRoomSockets(io, data.roomId);
        const members = roomSockets.map((sid) => ({
          socketId: sid,
          userId: connectedSockets.get(sid)?.userId,
          displayName: connectedSockets.get(sid)?.displayName,
        }));

        callback?.({ success: true, data: { roomId: data.roomId, members } });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("webrtc:offer", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId, offer } = webrtcSignalSchema.parse(payload);
        const targetSocketId = getUserSocketId(data.roomId, targetUserId);

        if (!targetSocketId) {
          return callback?.({ success: false, error: "Target user not in room" });
        }

        io.to(targetSocketId).emit("webrtc:offer", {
          fromUserId: userId,
          fromSocketId: socket.id,
          offer,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("webrtc:answer", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId, answer } = webrtcSignalSchema.parse(payload);
        const targetSocketId = getUserSocketId(data.roomId, targetUserId);

        if (!targetSocketId) {
          return callback?.({ success: false, error: "Target user not in room" });
        }

        io.to(targetSocketId).emit("webrtc:answer", {
          fromUserId: userId,
          fromSocketId: socket.id,
          answer,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("webrtc:ice-candidate", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId, candidate } = iceCandidateSchema.parse(payload);
        const targetSocketId = getUserSocketId(data.roomId, targetUserId);

        if (!targetSocketId) {
          return callback?.({ success: false, error: "Target user not in room" });
        }

        io.to(targetSocketId).emit("webrtc:ice-candidate", {
          fromUserId: userId,
          fromSocketId: socket.id,
          candidate,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("media:state", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const state = mediaStateSchema.parse(payload);

        socket.to(data.roomId).emit("media:state", {
          userId,
          socketId: socket.id,
          ...state,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("screen:start", async (_payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        io.to(data.roomId).emit("screen:start", {
          userId,
          socketId: socket.id,
          displayName,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("screen:stop", async (_payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        io.to(data.roomId).emit("screen:stop", {
          userId,
          socketId: socket.id,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("presenter:request", async (_payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { data: member } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (!member || (member.role !== "owner" && member.role !== "moderator")) {
          return callback?.({
            success: false,
            error: "Only owner/moderator can present",
          });
        }

        io.to(data.roomId).emit("presenter:granted", {
          userId,
          displayName,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("presenter:approve", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId } = presenterSchema.parse(payload);
        const targetSocketId = getUserSocketId(data.roomId, targetUserId);

        if (!targetSocketId) {
          return callback?.({ success: false, error: "Target user not in room" });
        }

        const { data: callerMember } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (
          !callerMember ||
          (callerMember.role !== "owner" && callerMember.role !== "moderator")
        ) {
          return callback?.({ success: false, error: "Not authorized" });
        }

        io.to(targetSocketId).emit("presenter:approved", {
          approvedBy: userId,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("presenter:transfer", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId } = presenterSchema.parse(payload);

        const { data: callerMember } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (!callerMember || callerMember.role !== "owner") {
          return callback?.({ success: false, error: "Only owner can transfer" });
        }

        const targetSocketId = getUserSocketId(data.roomId, targetUserId);

        if (targetSocketId) {
          io.to(targetSocketId).emit("presenter:transferred", {
            transferredBy: userId,
          });
        }

        io.to(data.roomId).emit("presenter:changed", {
          newPresenterId: targetUserId,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("chat:message", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        if (!userId) {
          return callback?.({ success: false, error: "Authentication required" });
        }

        const { content } = chatMessageSchema.parse(payload);

        const { data: message, error } = await supabaseAdmin
          .from("messages")
          .insert({
            room_id: data.roomId,
            user_id: userId,
            content,
            type: "text",
          })
          .select()
          .single();

        if (error) throw error;

        io.to(data.roomId).emit("chat:message", message);

        callback?.({ success: true, data: message });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("chat:typing", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { isTyping } = chatTypingSchema.parse(payload);

        socket.to(data.roomId).emit("chat:typing", {
          userId,
          displayName,
          isTyping,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("chat:reaction", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { messageId, emoji } = chatReactionSchema.parse(payload);

        io.to(data.roomId).emit("chat:reaction", {
          userId,
          displayName,
          messageId,
          emoji,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("browser:navigate", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { url } = browserNavigateSchema.parse(payload);

        io.to(data.roomId).emit("browser:navigate", {
          userId,
          displayName,
          url,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("browser:tab-create", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const tab = browserTabSchema.parse(payload);

        io.to(data.roomId).emit("browser:tab-create", {
          userId,
          ...tab,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("browser:tab-close", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { tabId } = z
          .object({ tabId: z.string().uuid() })
          .parse(payload);

        io.to(data.roomId).emit("browser:tab-close", { userId, tabId });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("browser:tab-switch", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { tabId } = z
          .object({ tabId: z.string().uuid() })
          .parse(payload);

        io.to(data.roomId).emit("browser:tab-switch", { userId, tabId });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("file:shared", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        io.to(data.roomId).emit("file:shared", {
          userId,
          displayName,
          ...payload,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("whiteboard:operation", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        socket.to(data.roomId).emit("whiteboard:operation", {
          userId,
          ...payload,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("notes:update", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        socket.to(data.roomId).emit("notes:update", {
          userId,
          ...payload,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("poll:create", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        if (!userId) {
          return callback?.({ success: false, error: "Authentication required" });
        }

        const body = pollCreateSchema.parse(payload);

        const { data: poll, error } = await supabaseAdmin
          .from("polls")
          .insert({
            room_id: data.roomId,
            user_id: userId,
            question: body.question,
            options: body.options,
          })
          .select()
          .single();

        if (error) throw error;

        io.to(data.roomId).emit("poll:created", poll);

        callback?.({ success: true, data: poll });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("poll:vote", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        if (!userId) {
          return callback?.({ success: false, error: "Authentication required" });
        }

        const { pollId, optionIndex } = pollVoteSchema.parse(payload);

        const { data: existingVote } = await supabaseAdmin
          .from("poll_votes")
          .select("id")
          .eq("poll_id", pollId)
          .eq("user_id", userId)
          .single();

        if (existingVote) {
          await supabaseAdmin
            .from("poll_votes")
            .delete()
            .eq("id", existingVote.id);
        }

        const { data: vote, error } = await supabaseAdmin
          .from("poll_votes")
          .insert({
            poll_id: pollId,
            user_id: userId,
            option_index: optionIndex,
          })
          .select()
          .single();

        if (error) throw error;

        io.to(data.roomId).emit("poll:voted", {
          pollId,
          userId,
          optionIndex,
        });

        callback?.({ success: true, data: vote });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("hand:raise", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        io.to(data.roomId).emit("hand:raised", {
          userId,
          displayName,
          raised: payload?.raised ?? true,
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("reaction:send", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { emoji } = reactionSchema.parse(payload);

        io.to(data.roomId).emit("reaction:received", {
          userId,
          displayName,
          emoji,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("moderation:kick", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId, reason } = moderationSchema.parse(payload);

        const { data: callerMember } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (
          !callerMember ||
          (callerMember.role !== "owner" && callerMember.role !== "moderator")
        ) {
          return callback?.({ success: false, error: "Not authorized" });
        }

        const { data: targetMember } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", targetUserId)
          .single();

        if (!targetMember) {
          return callback?.({ success: false, error: "User not in room" });
        }
        if (targetMember.role === "owner") {
          return callback?.({ success: false, error: "Cannot kick the owner" });
        }

        await supabaseAdmin
          .from("room_members")
          .delete()
          .eq("room_id", data.roomId)
          .eq("user_id", targetUserId);

        const targetSocketId = getUserSocketId(data.roomId, targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("moderation:kicked", {
            reason,
            kickedBy: displayName,
          });
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(data.roomId);
            connectedSockets.get(targetSocketId)!.roomId = null;
          }
        }

        io.to(data.roomId).emit("moderation:user-kicked", {
          targetUserId,
          reason,
          kickedBy: userId,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("moderation:ban", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId, reason } = moderationSchema.parse(payload);

        const { data: callerMember } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (
          !callerMember ||
          (callerMember.role !== "owner" && callerMember.role !== "moderator")
        ) {
          return callback?.({ success: false, error: "Not authorized" });
        }

        const { data: targetMember } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", targetUserId)
          .single();

        if (!targetMember) {
          return callback?.({ success: false, error: "User not in room" });
        }
        if (targetMember.role === "owner") {
          return callback?.({ success: false, error: "Cannot ban the owner" });
        }

        await supabaseAdmin
          .from("room_members")
          .delete()
          .eq("room_id", data.roomId)
          .eq("user_id", targetUserId);

        await supabaseAdmin.from("bans").insert({
          room_id: data.roomId,
          user_id: targetUserId,
          banned_by: userId,
          reason: reason || null,
        });

        const targetSocketId = getUserSocketId(data.roomId, targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("moderation:banned", {
            reason,
            bannedBy: displayName,
          });
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(data.roomId);
            connectedSockets.get(targetSocketId)!.roomId = null;
          }
        }

        io.to(data.roomId).emit("moderation:user-banned", {
          targetUserId,
          reason,
          bannedBy: userId,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("moderation:mute", async (payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { targetUserId } = moderationSchema.parse(payload);

        const { data: callerMember } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (
          !callerMember ||
          (callerMember.role !== "owner" && callerMember.role !== "moderator")
        ) {
          return callback?.({ success: false, error: "Not authorized" });
        }

        await supabaseAdmin
          .from("room_members")
          .update({ is_muted: true })
          .eq("room_id", data.roomId)
          .eq("user_id", targetUserId);

        const targetSocketId = getUserSocketId(data.roomId, targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("moderation:muted", {
            mutedBy: displayName,
          });
        }

        io.to(data.roomId).emit("moderation:user-muted", {
          targetUserId,
          mutedBy: userId,
        });

        callback?.({ success: true });
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? "Invalid payload"
            : (err as Error).message;
        callback?.({ success: false, error: message });
      }
    });

    socket.on("room:lock", async (_payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { data: member } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (
          !member ||
          (member.role !== "owner" && member.role !== "moderator")
        ) {
          return callback?.({ success: false, error: "Not authorized" });
        }

        await supabaseAdmin
          .from("rooms")
          .update({ is_locked: true })
          .eq("id", data.roomId);

        io.to(data.roomId).emit("room:locked", { lockedBy: userId });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("room:unlock", async (_payload, callback) => {
      try {
        const data = connectedSockets.get(socket.id);
        if (!data?.roomId) {
          return callback?.({ success: false, error: "Not in a room" });
        }

        const { data: member } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", data.roomId)
          .eq("user_id", userId)
          .single();

        if (
          !member ||
          (member.role !== "owner" && member.role !== "moderator")
        ) {
          return callback?.({ success: false, error: "Not authorized" });
        }

        await supabaseAdmin
          .from("rooms")
          .update({ is_locked: false })
          .eq("id", data.roomId);

        io.to(data.roomId).emit("room:unlocked", { unlockedBy: userId });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on("disconnect", (reason) => {
      const data = connectedSockets.get(socket.id);
      if (data?.roomId) {
        io.to(data.roomId).emit("user:left", {
          userId,
          socketId: socket.id,
          displayName,
        });
      }

      connectedSockets.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id} (user: ${userId || "guest"}, room: ${data?.roomId || "none"}, reason: ${reason})`);
    });
  });
}
