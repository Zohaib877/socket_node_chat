import callController from '../app/controllers/callController.js';
import auth from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

router.get('/end', auth.verifyAuthToken, auth.globalResponse, callController.endCall);
router.get(`/call-history/:type?`, auth.verifyAuthToken, auth.globalResponse, callController.callHistory)


export default router;