import conversationController from "../app/controllers/conversationController.js";
import auth from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.get(
  "/single-conversation",
  auth.verifyAuthToken,
  auth.globalResponse,
  conversationController.getSingleConversations
);
router.post(
  "/store/private",
  auth.verifyAuthToken,
  auth.globalResponse,
  conversationController.createPrivateConversation
);
router.delete(
  "/delete/:id",
  auth.verifyAuthToken,
  auth.globalResponse,
  conversationController.deleteConversation
);

router.post(
  "/join/:id",
  auth.verifyAuthToken,
  auth.globalResponse,
  conversationController.joinConversation
);

// router.get('/group-conversation', auth.verifyAuthToken, auth.globalResponse, conversationController.getGroupConversations);
router.post(
  "/store/group",
  auth.verifyAuthToken,
  auth.globalResponse,
  conversationController.createGroupConversation
);
router.post(
  "/update/group/:id",
  auth.verifyAuthToken,
  auth.globalResponse,
  conversationController.updateGroupConversation
);
router.delete(
  "/leave/group/:id",
  auth.verifyAuthToken,
  auth.globalResponse,
  conversationController.leaveGroupConversation
);
// router.delete(
//   "/delete/group/:id",
//   auth.verifyAuthToken,
//   auth.globalResponse,
//   conversationController.deleteGroupConversation
// );

export default router;
