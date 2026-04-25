import controller from "infra/controller.js";
import { createRouter } from "next-connect";
import user from "models/user.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const userImputValues = request.body;
  const newUser = await user.create(userImputValues);

  const newActivation = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, newActivation);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:user",
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}
