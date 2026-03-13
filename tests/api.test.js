/**
 * API integration tests. Run with: npm test
 * NODE_ENV=test so DB connect is skipped; only routes that do not require DB are fully tested.
 */
const request = require("supertest");
const app = require("../server");

describe("API", () => {
  describe("GET /", () => {
    it("returns 200 and API running message", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.text).toContain("BugTrack API Running");
    });
  });

  describe("GET /api/bugs", () => {
    it("returns 401 without Authorization", async () => {
      const res = await request(app).get("/api/bugs");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /api/analytics/bugs", () => {
    it("returns 401 without Authorization", async () => {
      const res = await request(app).get("/api/analytics/bugs");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /api (unmatched)", () => {
    it("returns 404 for unknown API path", async () => {
      const res = await request(app).get("/api/unknown");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Not found");
    });
  });
});
