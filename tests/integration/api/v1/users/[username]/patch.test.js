import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique username", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueuser2",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You are not authorized to request this resource.",
        action: "verify if your user has the required feature update:user.",
        statusCode: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const user = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(user);
      const SessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistent",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${SessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The username was not found.",
        action: "verify if the username is correct.",
        statusCode: 404,
      });
    });

    test("With duplicated username", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const user2 = await orchestrator.createUser({
        username: "user2",
      });

      const activatedUser2 = await orchestrator.activateUser(user2);
      const user2SessionObject = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user2SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The username is already in use.",
        action: "Try a different username to this operation.",
        statusCode: 400,
      });
    });

    test("With `user2` targeting `user1`", async () => {
      await orchestrator.createUser({
        username: "newuser1",
      });

      const user2 = await orchestrator.createUser({
        username: "newuser2",
      });

      const activatedUser2 = await orchestrator.activateUser(user2);
      const user2SessionObject = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/newuser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user2SessionObject.token}`,
          },
          body: JSON.stringify({
            username: "newuser3",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You are not authorized to update another user.",
        action:
          "verify if you have the required feature to update another user.",
        statusCode: 403,
      });
    });

    test("With duplicated email", async () => {
      await orchestrator.createUser({
        email: "email1@tabgeo.com.br",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@tabgeo.com.br",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const user2SessionObject = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user2SessionObject.token}`,
          },
          body: JSON.stringify({
            email: "email1@tabgeo.com.br",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The email is already in use.",
        action: "Try a different email to this operation.",
        statusCode: 400,
      });
    });

    test("With unique username", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueuser2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueuser2",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique email", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2@tabgeo.com.br",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: "uniqueEmail2@tabgeo.com.br",
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new password", async () => {
      const createdUser = await orchestrator.createUser({
        password: "newPassword1",
      });

      const activatedUser = await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        activatedUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Privileged user", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatedPrivilegedUser = await orchestrator.activateUser(privilegedUser);

      await orchestrator.addFeatureToUser(privilegedUser, ["update:user:others"]);

      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "defaultUserNewUsername",
          }),
        },
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "defaultUserNewUsername",
        email: defaultUser.email,
        features: defaultUser.features,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

  });
});
