import agorController from '../app/controllers/agorController.js';
import auth from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

router.get('/:role/:id', auth.verifyAuthToken, auth.globalResponse, agorController.getAgoraToken);

export default router;