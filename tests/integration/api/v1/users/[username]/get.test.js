import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match on `username`", async () => {
      await orchestrator.createUser({
        username: "SameCase",
        email: "samecase@tabgeo.com.br",
        password: "senha123",
      });

      const response2 = await fetch(
        `${webserver.origin}/api/v1/users/SameCase`,
      );

      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: "SameCase",
        features: ["read:activation_token"],
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();
    });

    test("With case mismatch on `username`", async () => {
      await orchestrator.createUser({
        username: "DifferentCase",
        email: "differentcase@tabgeo.com.br",
        password: "senha123",
      });

      const response2 = await fetch(
        `${webserver.origin}/api/v1/users/differentcase`,
      );

      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: "DifferentCase",
        features: ["read:activation_token"],
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();
    });

    test("With nonexistent `username`", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/users/nonexistent`,
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The username was not found.",
        action: "verify if the username is correct.",
        statusCode: 404,
      });
    });
  });
});
