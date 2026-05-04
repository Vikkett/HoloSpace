import request from "supertest";
import { app } from "../server/app.mjs";

describe("Server basic behavior", () => {


  test("chat fails without sessionId", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({
        userMessage: "hello"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("sessionId required");
  });

  test("chat works with sessionId", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({
        sessionId: "test1",
        userMessage: "create universe"
      });

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("phase");
    expect(res.body).toHaveProperty("step");
  });

  test("google auth rejects invalid token", async () => {
    const res = await request(app)
      .post("/auth/google")
      .send({
        token: "fake-token"
      });

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