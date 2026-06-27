import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With nonexistent `session`", async () => {
      const nonexistentSessionToken =
        "6345a698d6f96faecbc1e07fba999f94e836bcc67cf64b719cbf1b2c9752b563b3a776cab534b73a0258954f2cdd852b";

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${nonexistentSessionToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "The user hasn't a valid session.",
        action: "Do login to continue.",
        statusCode: 401,
      });
    });

    test("With expired `session`", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - (session.EXPIRATION_IN_MILLISECONDS + 1000)),
        toFake: ["Date"],
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const expiredSessionObject =
        await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${expiredSessionObject.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "The user hasn't a valid session.",
        action: "Do login to continue.",
        statusCode: 401,
      });
    });

    test("With valid `session`", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS + 1000), // One second to expire
      });

      const createdUser = await orchestrator.createUser();

      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: sessionObject.id,
        token: sessionObject.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(
        new Date(responseBody.expires_at).getTime() <
          new Date(sessionObject.expires_at).getTime(),
      ).toBe(true);
      expect(
        new Date(responseBody.updated_at).getTime() >
          new Date(sessionObject.updated_at).getTime(),
      ).toBe(true);

      // Set cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });

      // Double check assertions on api/v1/user endpoint
      const doubleCheckResponse = await fetch(
        `${webserver.origin}/api/v1/user`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(doubleCheckResponse.status).toBe(401);

      const doubleCheckResponseBody = await doubleCheckResponse.json();

      expect(doubleCheckResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "The user hasn't a valid session.",
        action: "Do login to continue.",
        statusCode: 401,
      });
    });
  });
});
