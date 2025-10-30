import { Server } from 'socket.io';
const socketIO = (expressServer) => {
    return {
        _instance: null,
        get instance() {
            if (!this._instance) {
                this._instance = new Server(expressServer, {
                    cors: {
                        origin: "*",
                        methods: ["GET", "POST"]
                    }
                });
            }
            return this._instance;
        }
    };
};

export default socketIO;
