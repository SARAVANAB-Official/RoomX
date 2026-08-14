import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { fileUploadLimiter } from "../middleware/rateLimiter.js";
import { sanitizeFilename } from "../utils/ids.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors.js";

const router = Router();

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/zip",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

async function assertMember(roomId: string, userId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();
  if (!data) throw new ForbiddenError("Not a member of this room");
}

function shapeFile(f: any) {
  return {
    id: f.id,
    roomId: f.room_id,
    userId: f.user_id,
    name: f.filename,
    originalName: f.original_name,
    mimeType: f.mime_type,
    size: f.file_size,
    url: f.storage_path,
    type: f.file_type,
    createdAt: f.created_at,
  };
}

router.get("/api/rooms/:roomId/files", authenticate, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    await assertMember(roomId, req.userId!);

    const { data, error } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: (data || []).map(shapeFile) });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/api/rooms/:roomId/files",
  authenticate,
  fileUploadLimiter,
  async (req, res, next) => {
    try {
      const { roomId } = req.params;
      await assertMember(roomId, req.userId!);

      if (!req.body || typeof req.body !== "object") {
        throw new ValidationError("Request body is required");
      }

      const fileSchema = z.object({
        name: z.string().min(1).max(255),
        mimeType: z.string(),
        size: z.coerce.number().int().positive(),
        url: z.string().url(),
      });

      const body = fileSchema.parse(req.body);

      if (!ALLOWED_MIME_TYPES.includes(body.mimeType)) {
        throw new ValidationError(
          `File type ${body.mimeType} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        );
      }

      if (body.size > MAX_FILE_SIZE) {
        throw new ValidationError(
          `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        );
      }

      const safeName = sanitizeFilename(body.name);

      function getFileType(mime: string): string {
        if (mime.startsWith("image/")) return "image";
        if (mime.startsWith("video/")) return "video";
        if (mime.startsWith("audio/")) return "audio";
        if (mime.includes("pdf") || mime.includes("document") || mime.includes("zip")) return "document";
        if (mime.startsWith("text/")) return "text";
        return "other";
      }

      const { data, error } = await supabaseAdmin
        .from("files")
        .insert({
          room_id: roomId,
          user_id: req.userId,
          filename: safeName,
          original_name: body.name,
          mime_type: body.mimeType,
          file_size: body.size,
          storage_path: body.url,
          file_type: getFileType(body.mimeType),
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: shapeFile(data) });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/api/rooms/:roomId/files/:fileId",
  authenticate,
  async (req, res, next) => {
    try {
      const { roomId, fileId } = req.params;
      await assertMember(roomId, req.userId!);

      const { data: file } = await supabaseAdmin
        .from("files")
        .select("user_id")
        .eq("id", fileId)
        .eq("room_id", roomId)
        .single();

      if (!file) throw new NotFoundError("File not found");
      if (file.user_id !== req.userId) {
        const { data: member } = await supabaseAdmin
          .from("room_members")
          .select("role")
          .eq("room_id", roomId)
          .eq("user_id", req.userId)
          .single();

        if (!member || (member.role !== "owner" && member.role !== "moderator")) {
          throw new ForbiddenError("Can only delete your own files");
        }
      }

      const { error } = await supabaseAdmin
        .from("files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      res.json({ success: true, data: { message: "File deleted" } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
