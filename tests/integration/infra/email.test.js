import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("`send`", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "TabGeo <contato@tabgeo.com.br>",
      to: "test@test.com",
      subject: "Test Email",
      text: "This is a body of test email",
    });

    await email.send({
      from: "TabGeo <contato@tabgeo.com.br>",
      to: "test@test.com",
      subject: "Test Email, ultimo email enviado",
      text: "This is a body of test email, ultimo email enviado",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@tabgeo.com.br>");
    expect(lastEmail.recipients[0]).toBe("<test@test.com>");
    expect(lastEmail.subject).toBe("Test Email, ultimo email enviado");
    expect(lastEmail.text).toBe(
      "This is a body of test email, ultimo email enviado\n",
    );
  });
});
