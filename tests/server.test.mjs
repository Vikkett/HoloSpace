import request from "supertest";
import { app } from "../server/app.mjs";
import { createPlanet } from "../server/app.mjs";

describe("Server basic behavior", () => {

  test("chat fails without sessionId", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ userMessage: "hello" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("sessionId required");
  });

  test("chat works with sessionId", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({
        sessionId: "test1",
        userMessage: "hello"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("phase");
    expect(res.body).toHaveProperty("step");
  });

  test("chat returns valid JSON structure", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({
        sessionId: "integration-test",
        userMessage: "hello"
      });

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("planets");
    expect(res.body).toHaveProperty("step");
    expect(res.body).toHaveProperty("phase");

    expect(
      res.body.planets === null || Array.isArray(res.body.planets)
    ).toBe(true);
  });

  test("5 messages create planets", async () => {
    const sessionId = "flow-test";

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/chat")
        .send({
          sessionId,
          userMessage: "test answer"
        });
    }

    const res = await request(app)
      .post("/api/chat")
      .send({
        sessionId,
        userMessage: "final"
      });

    expect(res.body.totalPlanetsCreated).toBeGreaterThanOrEqual(5);
  });

  test("google auth rejects invalid token", async () => {
    const res = await request(app)
      .post("/auth/google")
      .send({ token: "fake-token" });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid Google token");
  });

  test("profile blocked without token", async () => {
    const res = await request(app)
      .get("/user/profile");

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("No token");
  });

});


describe("Planet creation defaults", () => {

  test("createPlanet applies default values", () => {
    const session = { allPlanets: [] };

    const result = createPlanet(session, { name: "TestPlanet" });

    expect(result.planet.color).toBeDefined();
    expect(result.planet.size).toBeGreaterThan(0);
    expect(result.planet.dist).toBeGreaterThan(0);
  });

});