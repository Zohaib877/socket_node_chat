import TranscriptService from "../services/TranscriotionService.js";

class Transcript {
    constructor(app, socket) {
        this.app = app;
        this.socket = socket;

        this.handler = {
            transcript: initiateTranscript.bind(this),
        };
    }
}

function initiateTranscript(params) {
    TranscriptService.transcription(params, this.socket);
}

export default Transcript;
