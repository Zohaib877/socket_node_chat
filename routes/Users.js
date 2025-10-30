import UserController from '../app/controllers/UserController.js';
import auth from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();
router.post('/check-session', auth.globalResponse, UserController.checkSession);
router.post("/login", auth.globalResponse, UserController.login);
router.post("/verify", auth.globalResponse, UserController.verifyOTP);

router.post('/update', auth.verifyAuthToken, auth.globalResponse, UserController.userUpdate);

router.post('/change-number', auth.verifyAuthToken, auth.globalResponse, UserController.changeNumber);
router.post('/update-number', auth.verifyAuthToken, auth.globalResponse, UserController.changeNumberOTP);

router.post('/validate-user', auth.verifyAuthToken, auth.globalResponse, UserController.validateUser);

router.post("/logout", auth.verifyAuthToken, auth.globalResponse, UserController.logout);
router.delete('/account/delete', auth.verifyAuthToken, auth.globalResponse, UserController.deleteAccount);

export default router;