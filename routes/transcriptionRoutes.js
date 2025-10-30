import auth from '../middleware/authMiddleware.js';
import express from 'express';
import transcriptionController from '../app/controllers/transcriptionController.js';

const router = express.Router();

router.get('/:call_id', auth.verifyAuthToken, auth.globalResponse, transcriptionController.getTranscription);

export default router;