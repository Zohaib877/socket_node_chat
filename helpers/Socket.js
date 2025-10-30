export function sendNotification(req, notification) {
    const io = req.app.get('socket');
    io.sockets.to(notification.receiver).emit('notification', notification);
};

export function sendMessageSignal(req, message) {
    const io = req.app.get('socket');
    io.in(message.con_id).emit('message', message);
};