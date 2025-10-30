import MessageService from "../services/MessageService.js";

class Message {
    constructor(app, socket) {
        this.app = app;
        this.socket = socket;

        this.handler = {
            sendMessage: sendMessage.bind(this),
            deleteMessage: deleteMessage.bind(this)
        };
    }
}

function sendMessage(params){
    MessageService.create(params, this.socket);
}

function deleteMessage(params){
    MessageService.remove(params, this.socket);
}

export default Message;
