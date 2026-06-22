import controller from "infra/controller.js";
import { createRouter } from "next-connect";
import migrator from "models/migrator.js";
import authorization from "models/authorization.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:migration"), getHandler)
  .post(controller.canRequest("run:migration"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "run:migration",
    migratedMigrations,
  );

  if (migratedMigrations.length > 0) {
    return response.status(201).json(secureOutputValues);
  }

  return response.status(200).json(secureOutputValues);
}
