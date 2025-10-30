const activeStreams = {};

async function initiate(params, socket) {
    const user = socket.user;
    const recevired = 'user-' + params.user_id;
    if(params.user_id){
        socket.to([recevired]).emit('stream', params);
    }
}

async function join(params, socket) {
    const user = socket.user;
    const streamKey = `stream-${params.stream_id}`;
    if (!activeStreams[streamKey]) {
        activeStreams[streamKey] = new Set();
    }
    activeStreams[streamKey].add(user.id);
    socket.join(streamKey)
    socket.to(streamKey).emit('stream-joined', { user_id: user, stream_id: params.stream_id });
}

async function leave(params, socket) {
    const user = socket.user;
    const streamKey = `stream-${params.stream_id}`;
    if (activeStreams[streamKey]) {
        activeStreams[streamKey].delete(user.id);
        if (activeStreams[streamKey].size === 0) {
            delete activeStreams[streamKey];
        }
    }
    socket.leave(streamKey);
    socket.to(streamKey).emit('stream-left', { user_id: user, stream_id: params.stream_id });
}

async function comment(params, socket) {
    const user = socket.user;
    const streamKey = `stream-${params.stream_id}`;

    socket.to(streamKey).emit('stream-comment', {
        user_id: user,
        stream_id: params.stream_id,
        comment: params.comment,
        timestamp: Date.now(),
    });
}

async function like(params, socket) {
    const user = socket.user;
    const streamKey = `stream-${params.stream_id}`;

    socket.to(streamKey).emit('stream-like', {
        user_id: user.id,
        stream_id: params.stream_id,
        timestamp: Date.now(),
    });
}

export default {
    initiate,
    join,
    leave,
    comment,
    like,
};