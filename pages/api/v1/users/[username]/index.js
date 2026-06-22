import controller from "infra/controller.js";
import { createRouter } from "next-connect";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  return response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userImputValues = request.body;

  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "You are not authorized to update another user.",
      action: "verify if you have the required feature to update another user.",
    });
  }

  const userUpdated = await user.update(username, userImputValues);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    userUpdated,
  );

  console.log(secureOutputValues);
  return response.status(200).json(secureOutputValues);
}
