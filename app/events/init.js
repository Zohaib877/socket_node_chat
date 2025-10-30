import Message from './Message.js';
import Calling from './Calling.js';
import socketMiddleware from '../../middleware/SocketMiddleware.js';
import logger from '../../utils/logger.js';
import { User } from '../models/init.js';
import Stream from './stream.js';
import Transcript from './Transcript.js';

export default function initSocket(io) {
    const app = {
        allSockets: []
    };

    io.use(socketMiddleware);

    io.on('connection', async function (socket) {
        if (!socket.user) {
            return;
        }
        logger.info(`Socket connected: ${socket.id}-${socket.user.id.toString()}`);
        console.log(`Socket connected: ${socket.id}-${socket.user.id.toString()}`);
        await User.update(
            {
                is_online: 1
            },
            {
                where: {
                    id: socket.user.id,
                },
            }
        );

        socket.join(['user-' + socket.user.id.toString(), ...socket.joinedGroups]);
        socket.broadcast.emit('user-' + socket.user.id.toString(), "Online");
        console.log('user-' + socket.user.id.toString(), "Online");

        socket.on('disconnect', async () => {
            logger.info(`Socket disconnected: ${socket.id}-${socket.user.id.toString()}`);
            console.log(`Socket disconnected: ${socket.id}-${socket.user.id.toString()}`);

            // Clean up listeners to avoid memory leaks
            socket.removeAllListeners();

            // socket.to('user-' + socket.user.id).emit('status', "Offline");
            socket.broadcast.emit('user-' + socket.user.id.toString(), "Offline");
            await User.update(
                {
                    is_online: 0
                },
                {
                    where: {
                        id: socket.user.id,
                    },
                }
            );
        });

        socket.on('typing', (req) => {
            socket.to('user-' + req.receiver).emit('typing', req);
        });

        socket.on('re-join', async (e) => {
            // Handle re-joining logic if needed
        });

        socket.on('status', (req) => {
            const status = io.sockets.adapter.rooms.has('user-' + req.receiver) ? "Online" : "Offline";
            console.log(req.receiver);
            socket.emit(req.receiver, status);
            // socket.to('user-' + socket.user.id).emit('status', status);
            // console.log('user-' + socket.user.id);
        });

        socket.on('join-group', ({ userId, conversationId }) => {
            // const userSocket = Array.from(io.sockets.sockets.values()).find(s => 'user-' + s.user.id === userId);
            const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.user && 'user-' + s.user.id === userId);

            if (userSocket) {
                userSocket.join(`group-${conversationId}`);
                logger.info(`User ${userId} joined group-${conversationId}`);
            } else {
                logger.warn(`User socket for ID ${userId} not found`);
            }
        });

        // Create event handlers for this socket
        const eventHandlers = {
            chat: new Message(app, socket),
            call: new Calling(app, socket),
            stream: new Stream(app, socket),
            transcript: new Transcript(app, socket),
        };

        // Bind events to handlers
        for (const category in eventHandlers) {
            const handler = eventHandlers[category].handler;
            for (const event in handler) {
                socket.on(event, handler[event]);
            }
        }

        // Keep track of the socket
        app.allSockets.push(socket);
    });
};
