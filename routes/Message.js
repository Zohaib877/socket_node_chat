import messageController from '../app/controllers/messageController.js';
import auth from '../middleware/authMiddleware.js'; 
import express from 'express';

const router = express.Router();

router.get('/:id', auth.verifyAuthToken, auth.globalResponse, messageController.getmessages);
// router.get('/', auth.verifyAuthToken, messageController.getmessage);
// router.post("/store", auth.verifyAuthToken, messageController.createmessage);
// router.patch('/update/:id', auth.verifyAuthToken, messageController.updatemessage);
// router.delete('/delete/:id', auth.verifyAuthToken, messageController.deletemessage);

export default router;