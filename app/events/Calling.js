import CallingService from "../services/CallingService.js";

class Calling {
    constructor(app, socket) {
        this.app = app;
        this.socket = socket;

        this.handler = {
            callCreate: initiate.bind(this),
            callanswer: join.bind(this),
            callLeave: end.bind(this),
            callFinish: finishCall.bind(this)
        };
    }
}

// Events
function initiate(params) {
    CallingService.initiate(params, this.socket);
}
function join(params) {
    CallingService.join(params, this.socket);
}
function end(params) {
    CallingService.end(params, this.socket);
}
function finishCall(params) {
    CallingService.finish(params, this.socket);
}

export default Calling;
