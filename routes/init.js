import conversationsRoutes from "./Conversations.js";
import usersRoutes from "./Users.js";
import messagesRoutes from "./Message.js";
import agoraRoutes from "./agora.js";
import callRoutes from "./call.js";
import contentRoutes from "./content.js";
import transcriptionRoutes from "./transcriptionRoutes.js";
import express from 'express';

const router = express.Router();

router.use("/conversation", conversationsRoutes);
router.use("/user", usersRoutes);
router.use("/message", messagesRoutes);
router.use("/agora", agoraRoutes);
router.use("/call", callRoutes);
router.use("/content", contentRoutes);
router.use("/transcription", transcriptionRoutes);

export default router;