import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("ANY OTHER METHOD /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Any other method", async () => {
      const othermethods = ["PUT", "DELETE", "OPTIONS", "PATCH"];

      for (const method of othermethods) {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: method,
          },
        );

        expect(response.status).toBe(405);
      }
    });
  });
});
