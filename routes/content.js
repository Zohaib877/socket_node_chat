import express from 'express';
import contentController from '../app/controllers/contentController.js';
import auth from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.get('/', auth.globalResponse, contentController.getContent);
router.get('/:slug', auth.globalResponse, contentController.singleContent);

export default router;