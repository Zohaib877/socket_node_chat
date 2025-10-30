import Transcription from '../models/Transcription.js';
import { Call, CallParticipant, User } from '../models/init.js';
import { Op } from 'sequelize';

const saveTranscription = async (req, res) => {
    try {
        const { user_id, call_id, duration, language, message } = req.body;

        const transcription = await Transcription.create({
            user_id,
            call_id,
            duration,
            language,
            message,
        });

        return res.status(201).json({ success: true, transcription });
    } catch (error) {
        console.error("Transcription save error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const getTranscription = async (req, res) => {
    const user = req.user;
    const id = req.params.call_id;
    // console.log(id);
    const call = await Call.findOne({
        where: { session_id: id },
        include: [
            {
                model: CallParticipant,
                as: "call_participents",
                include: [
                    {
                        model: User,
                        as: "user",
                    }
                ]
            }
        ],
        order: [["createdAt", "DESC"]]
    });

    if (!call) {
        return res.responseInstance.handle({ transcription: [] }, 200, ["No transcription found."]);
    }
    console.log("call", call);
    const call_participents = call.call_participents;
    const call_participent_ids = call_participents.map(participent => participent.user_id);
    const call_participent_ids_string = call_participent_ids.join(',');

    const transcription = await Transcription.findAll({
        where: { call_id: id, user_id: { [Op.in]: call_participent_ids } },
        include: [
            {
                model: User,
                as: "user",
            },
        ],
        order: [["created_at", "DESC"]],
    });
    // console.log("transcription", transcription);
    return res.responseInstance.handle({ transcription }, 200);
    try {
    } catch (error) {
        console.error("Transcription get error:", error);
        return res.responseInstance.handle(null, 500, ["An unexpected error occurred while proceeding your request."], err.message);
    }
};


export default {
    getTranscription,
    saveTranscription
}