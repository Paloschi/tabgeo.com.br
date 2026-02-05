import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;

  const validActivationToken = await activation.findOneByValidId(tokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationToken = await activation.markTokenAsUsed(
    validActivationToken.id,
  );

  return response.status(200).json(usedActivationToken);
}
