import database from "infra/database.js";
import password from "models/password.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

async function create(userImputValues) {
  await validateUniqueUsername(userImputValues.username);
  await validateUniqueEmail(userImputValues.email);
  await hashPasswordInObject(userImputValues);
  injectDefaultFeaturesInObject(userImputValues);

  const newUser = await runInsertQuery(userImputValues);
  return newUser;

  async function runInsertQuery(userImputValues) {
    const results = await database.query({
      text: `
        INSERT INTO 
          users (username, email, password, features) 
        VALUES 
          ($1, $2, $3, $4)
        RETURNING 
          *
        ;`,
      values: [
        userImputValues.username,
        userImputValues.email,
        userImputValues.password,
        userImputValues.features,
      ],
    });
    return results.rows[0];
  }

  function injectDefaultFeaturesInObject(userImputValues) {
    userImputValues.features = ["read:activation_token"];
  }
}

async function findOneById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          users 
        WHERE 
          id = $1
        LIMIT 
          1
      ;`,
      values: [id],
    });

    if (results.rowCount == 0) {
      throw new NotFoundError({
        message: "The user idwas not found.",
        action: "verify if the user id is correct.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          users 
        WHERE 
          lower(username) = lower($1)
        LIMIT 
          1
      ;`,
      values: [username],
    });

    if (results.rowCount == 0) {
      throw new NotFoundError({
        message: "The username was not found.",
        action: "verify if the username is correct.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          users 
        WHERE 
          lower(email) = lower($1)
        LIMIT 
          1
      ;`,
      values: [email],
    });

    if (results.rowCount == 0) {
      throw new NotFoundError({
        message: "The email was not found.",
        action: "verify if the email is correct.",
      });
    }

    return results.rows[0];
  }
}

async function update(username, userImputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userImputValues) {
    await validateUniqueUsername(userImputValues.username);
  }

  if ("email" in userImputValues) {
    await validateUniqueEmail(userImputValues.email);
  }

  if ("password" in userImputValues) {
    await hashPasswordInObject(userImputValues);
  }

  const userWithNewValues = {
    ...currentUser,
    ...userImputValues,
  };

  const userUpdated = await runUpdateQuery(userWithNewValues);
  return userUpdated;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE 
          users 
        SET 
         username = $2, 
         email = $3, 
         password = $4,
         updated_at = timezone('utc', now())
        WHERE 
          id = $1 
        RETURNING 
          *
        ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });
    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT 
        username 
      FROM 
        users 
      WHERE 
        LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "The username is already in use.",
      action: "Try a different username to this operation.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT 
        email 
      FROM 
        users 
      WHERE 
        LOWER(email) = LOWER($1)
    ;`,
    values: [email],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "The email is already in use.",
      action: "Try a different email to this operation.",
    });
  }
}

async function hashPasswordInObject(userImputValues) {
  const hashedPassword = await password.hash(userImputValues.password);
  userImputValues.password = hashedPassword;
}

async function setFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
        UPDATE 
          users 
        SET 
          features = $2,
          updated_at = timezone('utc', now())
        WHERE 
          id = $1
        RETURNING 
          *
        ;
      `,
      values: [userId, features],
    });
    return results.rows[0];
  }
}

async function addFeaturesByUserId(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
        UPDATE 
          users 
        SET 
          features = array_cat(features, $2),
          updated_at = timezone('utc', now())
        WHERE 
          id = $1
        RETURNING 
          *
        ;
      `,
      values: [userId, features],
    });
    return results.rows[0];
  }
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  update,
  setFeatures,
  addFeaturesByUserId,
};

export default user;
