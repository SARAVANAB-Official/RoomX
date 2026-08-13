import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase.js";
import { config } from "../config/index.js";

const router = Router();

const guestSchema = z.object({
  displayName: z.string().min(1).max(50),
});

router.post("/api/auth/guest", async (req, res, next) => {
  try {
    const { displayName } = guestSchema.parse(req.body);
    const tempEmail = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@roomx.guest`;
    const tempPassword = `Gx-${Date.now()}-${Math.random().toString(36).slice(2)}!A1`;

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName, is_guest: true },
    });

    if (createError) throw createError;

    await supabaseAdmin.from("users").upsert({
      id: userData.user.id,
      email: tempEmail,
      display_name: displayName,
      is_guest: true,
    }, { onConflict: "id" });

    const anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword,
    });

    if (signInError) throw signInError;

    res.json({
      success: true,
      data: {
        user: signInData.user,
        session: signInData.session,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
