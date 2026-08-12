import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const { JWT_SECRET, TEST_USER_ID } = vi.hoisted(() => ({
  JWT_SECRET: "test-jwt-secret",
  TEST_USER_ID: "test-user-id-123",
}));

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "3001";
  process.env.CLIENT_URL = "http://localhost:5173";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
  process.env.JWT_SECRET = "test-jwt-secret";
});

vi.mock("../config/index.js", () => ({
  config: {
    nodeEnv: "test",
    port: 3001,
    clientUrl: "http://localhost:5173",
    supabaseUrl: "https://test.supabase.co",
    supabaseServiceKey: "test-service-key",
    supabaseAnonKey: "test-anon-key",
    jwtSecret: JWT_SECRET,
    turnServer: undefined,
    turnUsername: undefined,
    turnPassword: undefined,
  },
}));

const mockChainable = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  limit: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  then: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
};

const fromMock = vi.fn(() => ({ ...mockChainable }));

vi.mock("../lib/supabase.js", () => ({
  supabaseAdmin: { from: fromMock },
  supabaseClient: { from: fromMock },
}));

vi.mock("../lib/socket.js", () => ({
  setupSocketHandlers: vi.fn(),
}));

vi.mock("../middleware/rateLimiter.js", () => ({
  apiLimiter: (_req: any, _res: any, next: any) => next(),
  chatLimiter: (_req: any, _res: any, next: any) => next(),
  fileUploadLimiter: (_req: any, _res: any, next: any) => next(),
}));

function resetMocks() {
  mockChainable.single.mockReset();
  mockChainable.single.mockResolvedValue({ data: null, error: null });
  mockChainable.then.mockReset();
  mockChainable.then.mockResolvedValue({ data: [], error: null, count: 0 });
  fromMock.mockImplementation(() => ({ ...mockChainable }));
}

function createToken(userId: string = TEST_USER_ID): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
}

describe("Health API", () => {
  let app: any;

  beforeAll(async () => {
    const express = (await import("express")).default;
    const { default: healthRoutes } = await import("../routes/health.js");
    const { default: roomRoutes } = await import("../routes/rooms.js");
    const { default: messageRoutes } = await import("../routes/messages.js");

    const testApp = express();
    testApp.use(express.json());
    testApp.use(healthRoutes);
    testApp.use(roomRoutes);
    testApp.use(messageRoutes);
    app = testApp;
  });

  beforeEach(() => {
    resetMocks();
  });

  it("should return healthy status", async () => {
    mockChainable.then.mockResolvedValue({ data: [{ id: "1" }], error: null, count: 1 });

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("should contain required fields", async () => {
    mockChainable.then.mockResolvedValue({ data: [{ id: "1" }], error: null, count: 1 });

    const res = await request(app).get("/health");

    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("uptime");
    expect(res.body.data).toHaveProperty("version");
    expect(res.body.data).toHaveProperty("environment");
    expect(res.body.data).toHaveProperty("database");
  });

  it("should report degraded status on DB error", async () => {
    mockChainable.then.mockResolvedValue({ data: null, error: { message: "DB error" }, count: 0 });

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("degraded");
    expect(res.body.data.database).toBe("disconnected");
  });
});

describe("Rooms API", () => {
  let app: any;

  beforeAll(async () => {
    const express = (await import("express")).default;
    const { default: healthRoutes } = await import("../routes/health.js");
    const { default: roomRoutes } = await import("../routes/rooms.js");
    const { default: messageRoutes } = await import("../routes/messages.js");

    const testApp = express();
    testApp.use(express.json());
    testApp.use(healthRoutes);
    testApp.use(roomRoutes);
    testApp.use(messageRoutes);
    app = testApp;
  });

  beforeEach(() => {
    resetMocks();
  });

  describe("POST /api/rooms", () => {
    it("should create a room with valid data", async () => {
      const mockRoom = {
        id: "room-123",
        code: "ABC123",
        name: "Test Room",
        description: "A test room",
        max_participants: 50,
        is_private: false,
        owner_id: TEST_USER_ID,
        created_at: new Date().toISOString(),
      };

      mockChainable.single.mockResolvedValue({ data: mockRoom, error: null });

      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({
          name: "Test Room",
          description: "A test room",
          maxParticipants: 50,
          isPrivate: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should reject creation without auth token", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .send({ name: "Test Room" });

      expect(res.status).toBe(401);
    });

    it("should reject creation with missing name", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject creation with name too long", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({ name: "a".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/rooms/:roomId", () => {
    it("should return room info for valid room", async () => {
      const mockRoom = {
        id: "room-123",
        code: "ABC123",
        name: "Test Room",
        description: "A test room",
        max_participants: 50,
        is_private: false,
        owner_id: "owner-id",
        created_at: new Date().toISOString(),
      };

      mockChainable.single.mockResolvedValue({ data: mockRoom, error: null });

      const res = await request(app)
        .get("/api/rooms/room-123")
        .set("Authorization", `Bearer ${createToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Test Room");
    });

    it("should return 404 for non-existent room", async () => {
      mockChainable.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

      const res = await request(app)
        .get("/api/rooms/non-existent-room")
        .set("Authorization", `Bearer ${createToken()}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/rooms/:roomId/join", () => {
    it("should allow joining a room", async () => {
      const mockRoom = {
        id: "room-123",
        name: "Test Room",
        max_participants: 50,
        is_locked: false,
        is_private: false,
        owner_id: "owner-id",
      };

      mockChainable.single
        .mockResolvedValueOnce({ data: mockRoom, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockChainable.then.mockResolvedValue({ data: [], error: null, count: 0 });

      const res = await request(app)
        .post("/api/rooms/room-123/join")
        .set("Authorization", `Bearer ${createToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject join without auth", async () => {
      const res = await request(app)
        .post("/api/rooms/room-123/join");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/rooms/:roomId/leave", () => {
    it("should allow leaving a room", async () => {
      const mockMember = { id: "member-id", role: "member" };
      mockChainable.single.mockResolvedValue({ data: mockMember, error: null });

      const res = await request(app)
        .post("/api/rooms/room-123/leave")
        .set("Authorization", `Bearer ${createToken()}`);

      expect(res.status).toBe(200);
    });

    it("should prevent owner from leaving", async () => {
      const mockOwner = { id: "member-id", role: "owner" };
      mockChainable.single.mockResolvedValue({ data: mockOwner, error: null });

      const res = await request(app)
        .post("/api/rooms/room-123/leave")
        .set("Authorization", `Bearer ${createToken()}`);

      expect(res.status).toBe(403);
    });

    it("should reject leave without auth", async () => {
      const res = await request(app)
        .post("/api/rooms/room-123/leave");

      expect(res.status).toBe(401);
    });
  });
});

describe("Messages API", () => {
  let app: any;

  beforeAll(async () => {
    const express = (await import("express")).default;
    const { default: healthRoutes } = await import("../routes/health.js");
    const { default: roomRoutes } = await import("../routes/rooms.js");
    const { default: messageRoutes } = await import("../routes/messages.js");

    const testApp = express();
    testApp.use(express.json());
    testApp.use(healthRoutes);
    testApp.use(roomRoutes);
    testApp.use(messageRoutes);
    app = testApp;
  });

  beforeEach(() => {
    resetMocks();
    mockChainable.single.mockResolvedValue({ data: { id: "member-id" }, error: null });
  });

  describe("GET /api/rooms/:roomId/messages", () => {
    it("should return messages with pagination", async () => {
      mockChainable.then.mockResolvedValue({
        data: [
          { id: "msg-1", content: "Hello", user_id: TEST_USER_ID },
          { id: "msg-2", content: "World", user_id: "other-user" },
        ],
        error: null,
        count: 2,
      });

      const res = await request(app)
        .get("/api/rooms/test-room-id/messages?limit=50&offset=0")
        .set("Authorization", `Bearer ${createToken()}`);

      expect(res.status).toBe(200);
    });

    it("should reject messages fetch without auth", async () => {
      const res = await request(app)
        .get("/api/rooms/test-room-id/messages");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/rooms/:roomId/messages", () => {
    it("should post a message with valid content", async () => {
      const mockMessage = {
        id: "msg-123",
        content: "Hello World",
        user_id: TEST_USER_ID,
        room_id: "test-room-id",
        type: "text",
        created_at: new Date().toISOString(),
      };

      mockChainable.single
        .mockResolvedValueOnce({ data: { id: "member-id" }, error: null })
        .mockResolvedValueOnce({ data: mockMessage, error: null });

      const res = await request(app)
        .post("/api/rooms/test-room-id/messages")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({ content: "Hello World" });

      expect(res.status).toBe(201);
    });

    it("should reject empty message", async () => {
      const res = await request(app)
        .post("/api/rooms/test-room-id/messages")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject message exceeding max length", async () => {
      const res = await request(app)
        .post("/api/rooms/test-room-id/messages")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({ content: "a".repeat(5001) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject message without auth", async () => {
      const res = await request(app)
        .post("/api/rooms/test-room-id/messages")
        .send({ content: "Hello" });

      expect(res.status).toBe(401);
    });
  });
});
