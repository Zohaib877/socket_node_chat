import {participant} from '../app/models/init.js';
import logger from '../utils/logger.js';
import authMiddleware from './authMiddleware.js';

const socketMiddleware = async (socket, next) => {

    // Log socket events
    logger.info(`Socket connected: ${socket.id}`);
    const token = socket.handshake.query.token;
    console.log("Socket Token " + token);
    logger.info(`Socket connected token: ${token}`);
    
    if (!token) {
        socket.emit('conflict', "Not authorized");
        return next(new Error('Not authorized.'));
    }
    try {
        const user = await authMiddleware.verifySocketAuthToken(token);
        console.log(user);
        
        if (!user) {
            socket.emit('conflict', "Invalid Token! Please login again to continue.");
            return next(new Error('Invalid Token! Please login again to continue.'));
        }

        socket.joinedGroups = await participant.findAll({
            where: {
                user_id: user.id
            },
            attributes: ['conversation_id'],
            group: ['conversation_id']
        }).then((conversation) => 
            conversation.map(conversation => 'group-' + conversation.conversation_id)
        );
        
        socket.user = user;
        socket.emit('user', user);
        logger.info(`Socket connected user: ${user?.id}`);
        logger.info(JSON.stringify(user));
        
        socket.onAny((eventName, ...args) => {
            logger.info(`Socket event: ${eventName}, Data: ${JSON.stringify(args)}`);
        });

        return next();
    } catch (err) {
        socket.emit('conflict', err.message);
        logger.info(`Socket Conflict: ${err.message}`);
        return next(err);
    }
};

export default socketMiddleware;
