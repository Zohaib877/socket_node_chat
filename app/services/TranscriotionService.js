import Call from "../models/Call.js";
import Transcription from "../models/Transcription.js";
import { CallParticipant, User } from '../models/init.js';

async function transcription(params, socket) {
    try {
        const user = socket.user;
        const {
            call_id,
            message,
            duration,
            language
        } = params;

        const call = await Call.findOne({
            where: { session_id: call_id }
        });
        if (!call_id) {
            return socket.emit("transcript_error", { error: "Missing required fields" });
        }
        const saved = await Transcription.create({
            user_id: user.id,
            call_id,
            message,
            duration,
            language
        });
        const participents = await CallParticipant.findAll({
            where: {
                call_id: call.id
            },
            attributes: ["id", "user_id", "duration", "is_received"],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "profile_image", "full_name", "phone"]
                }
            ]
        })
        const IOuserIds = participents.map(p => `user-${p.user_id}`);
        IOuserIds.push(`user-${user.id}`)
        if (call) {
            socket.nsp.to(IOuserIds).emit('subtitle', {
                user_id: user.id,
                full_name: user.full_name,
                message,
                duration,
                language,
            });
            socket.emit("transcript_saved", { id: saved.id });
        }

    } catch (err) {
        console.error("Transcription error:", err);
        socket.emit("transcript_error", { error: "Server error" });
    }
}

export default {
    transcription
};
