import StreamService from "../services/StreamService.js";

class Stream{
    constructor(app, socket) {
        this.app = app;
        this.socket = socket;

        this.handler = {
            stream: initiate.bind(this),
            join: join.bind(this),
            leave: leave.bind(this),
            comment: comment.bind(this),
            like: like.bind(this),
        };
    }
}

// Events
function initiate(params){
    StreamService.initiate(params, this.socket);
}

function join(params){
    StreamService.join(params, this.socket);
}

function leave(params){
    StreamService.leave(params, this.socket);
}

function comment(params){
    StreamService.comment(params, this.socket);
}

function like(params){
    StreamService.like(params, this.socket);
}

export default Stream
