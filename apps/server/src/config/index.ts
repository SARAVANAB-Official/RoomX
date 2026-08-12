import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),

  TURN_SERVER: z.string().url().optional(),
  TURN_USERNAME: z.string().optional(),
  TURN_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  clientUrl: parsed.data.CLIENT_URL,
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseServiceKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
  jwtSecret: parsed.data.JWT_SECRET,
  turnServer: parsed.data.TURN_SERVER,
  turnUsername: parsed.data.TURN_USERNAME,
  turnPassword: parsed.data.TURN_PASSWORD,
} as const;
