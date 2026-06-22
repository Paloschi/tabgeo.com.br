import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Invalid email or password.",
        action: "verify if the data sent is correct.",
      });
    }
    throw error;
  }

  async function findUserByEmail(providedEmail) {
    let userStored;
    try {
      userStored = await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Invalid email or password.",
          action: "verify if the data sent is correct.",
        });
      }
      throw error;
    }
    return userStored;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );
    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Incorrect password.",
        action: "verify if the password is correct.",
      });
    }
  }
}

const authentication = {
  getUser,
};

export default authentication;
