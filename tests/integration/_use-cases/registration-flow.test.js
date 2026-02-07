import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all succcessful)", () => {
  let createUserResponseBody;
  let activationTokenId;
  let createSessionsResponseBody;

  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@tabgeo.com.br",
          password: "senha123",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@tabgeo.com.br",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@tabgeo.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@tabgeo.com.br>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no TabGeo");
    expect(lastEmail.text).toContain("RegistrationFlow");

    activationTokenId = orchestrator.extractUUID(lastEmail.text);
    const activationTokenObject =
      await activation.findOneByValidId(activationTokenId);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneById(createUserResponseBody.id);
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login to account", async () => {
    const createSessionsResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createUserResponseBody.email,
          password: "senha123",
        }),
      },
    );

    expect(createSessionsResponse.status).toBe(201);

    createSessionsResponseBody = await createSessionsResponse.json();

    expect(createSessionsResponseBody.user_id).toBe(createUserResponseBody.id);
  });

  test("Get user information", async () => {
    const getUserResponse = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        Cookie: `session_id=${createSessionsResponseBody.token}`,
      },
    });

    expect(getUserResponse.status).toBe(200);

    expect(createUserResponseBody.id).toBe(createUserResponseBody.id);
  });
});
