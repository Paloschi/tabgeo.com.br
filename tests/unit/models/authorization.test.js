import authorization from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";

describe("models/authorization.js", () => {
  describe(".can", () => {
    test("Without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("Without `user.features`", () => {
      const createdUser = {
        username: "User Without Features",
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("With unknown `feature`", () => {
      const createdUser = {
        username: "User With Unknown Feature",
        features: ["read:unknown"],
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("With valid `user` and `feature`", () => {
      const createdUser = {
        username: "User With Valid Feature",
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput", () => {
    test("Without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("Without `user.features`", () => {
      const createdUser = {
        username: "User Without Features",
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("With unknown `feature`", () => {
      const createdUser = {
        username: "User With Unknown Feature",
        features: ["read:unknown"],
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("With a valid `user`, known `feature` but no `resource`", () => {
      const createdUser = {
        username: "User With Valid Feature",
        features: ["read:user"],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("With valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        username: "User With Valid Feature",
        features: ["read:user"],
      };

      const resource = {
        id: "123",
        username: "User With Valid Feature",
        features: ["read:user"],
        email: "user@valid.feature",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: "123",
        username: "User With Valid Feature",
        features: ["read:user"],
        created_at: new Date(),
        updated_at: new Date(),
      });
    });
  });
});
