import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 1000 * 60 * 15; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newActivation = await runInsertQuery(userId, expiresAt);
  return newActivation;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO 
          user_activate_tokens (user_id, expires_at) 
        VALUES 
          ($1, $2) 
        RETURNING 
          *
        ;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function findOneByValidId(id) {
  const activationFound = await runSelectQuery(id);
  return activationFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          user_activate_tokens 
        WHERE 
          id = $1 
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT 
          1`,
      values: [id],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The activation token was not found.",
        action: "verify if the token is correct.",
      });
    }
    return results.rows[0];
  }
}

async function sendEmailToUser(user, activation) {
  await email.send({
    from: "TabGeo <contato@tabgeo.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no TabGeo",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no TabGeo:
${webserver.origin}/cadastro/ativar/${activation.id}

Atenciosamente,
Equipe TabGeo`,
  });
}

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `
        UPDATE 
          user_activate_tokens 
        SET 
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE 
          id = $1
        RETURNING 
          *
        ;
      `,
      values: [activationTokenId],
    });
    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "You are not authorized to activate the user.",
      action: "contact the support if you think this is an error.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);

  return activatedUser;
}

const activation = {
  create,
  findOneByValidId,
  sendEmailToUser,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
