import { Op } from "sequelize";
import { sendAPNSNotification, sendFCMNotification } from "../../helpers/notification.js";
import helper from "../../helpers/helpers.js";
import { Call, CallParticipant, User, UserDevice } from "../models/init.js";
import { v4 as uuidv4 } from 'uuid';

const endCall = async (req, res) => {
    try {
        console.log("socket REQ : ", req.query);
        const user = req.user;
        const sessionId = req.query.id;
        const receiverId = req.query.receiver_id;
        const io = req.app.get("socket");

        let participantUserIds = receiverId.split(",").map(Number);
        const participantRooms = participantUserIds.map(id => `user-${id}`);

        const call = await Call.findOne({
            where: { session_id: sessionId }
        });

        const userDevices = await UserDevice.findAll({
            where: { user_id: { [Op.in]: participantUserIds } },
            attributes: ['device_type', 'voip_token', 'device_token', 'access_token'],
        });

        if (call) {
            const callWithParticipants = {
                ...call.toJSON(),
                user
            };
            io.to([participantRooms]).emit('end_call', callWithParticipants, (error) => {
                if (error) {
                    console.error("Emit error:", error);
                } else {
                    console.log("Emit successful to", participantRooms);
                }
            });
        }

        await Promise.all(
            userDevices.map((device) => {
                const notificationData = {
                    title: 'Calling',
                    body: `${user.full_name} is calling you.`,
                    object_id: String(device.user_id),
                    actor_id: String(user.id),
                    actor_type: 'App\Models\User',
                    type: 'end_call',
                    object: 'end_call',
                    data: {
                        caller_id: String(user.id),
                        caller_name: `${user.full_name}`,
                        caller_image: String(user.profile_image),
                        conversation_id: String(call.conversation_id),
                        is_video: String(call.is_video),
                        type: 'end_call',
                        uuid: uuidv4(),
                        params: JSON.stringify(req.query),
                    },
                };

                let fcmPromise = Promise.resolve();

                if (device.device_type !== 'ios') {
                    fcmPromise = sendFCMNotification(device.device_token, notificationData);
                }

                const apnsPromise = device.device_type === 'ios'
                    ? sendAPNSNotification(device.voip_token, {
                        title: 'Hello!',
                        body: 'You have a new message.',
                        data: {
                            "aps": { "content-available": "1" }, // Ensure content-available is a string if required
                            "handle": "1111111",
                            "details": {
                                "caller_name": `${user.full_name}`,
                                "caller_id": String(user.id),
                                "user_id": String(device.user_id),
                                "id": String(device.user_id),
                                "body": 'You have a new message.',
                                "object_id": String(device.user_id),
                                "actor_id": String(user.id),
                                "actor_type": 'App\Models\User',
                                "type": 'end_call',
                                "object": 'end_call',
                            },
                            "type": 'end_call',
                            "caller_name": `${user.full_name}`,
                            "caller_id": String(user.id),
                            "caller_image": String(user.profile_image),
                            "conversation_id": String(call.conversation_id),
                            "is_video": String(call.is_video),
                            "uuid": uuidv4(), // If uuid needs to be a string, ensure it's formatted as such.
                            "params": req.query, // If uuid needs to be a string, ensure it's formatted as such.
                        },
                    })
                    : Promise.resolve();

                return Promise.all([fcmPromise, apnsPromise]);
            })
        );
        return res.responseInstance.handle({ 'status': true }, 200);
    } catch (err) {
        return res.responseInstance.handle(null, 500, "An unexpected error occurred while proceeding your request.", err.message);
    }
};

const callHistory = async (req, res) => {
    try {
        const user = req.user;
        const type = req.params.type;
        
        const page  = req.query.page ?? 1;
        const limit = req.query.limit ?? 20;
        console.log(page)
        let isReceivedFilter;
        if (type === "missed") {
            isReceivedFilter = 0;
        } else if (type === "accepted") {
            isReceivedFilter = 1;
        } else if (type === "rejected") {
            isReceivedFilter = 2;
        }

        const callParticipants = await CallParticipant.findAll({
            attributes: ["call_id", "is_received"],
            where: { user_id: user?.id }
        });
        const filteredCallIds = callParticipants
            .filter(participant => isReceivedFilter === undefined || participant.is_received === isReceivedFilter)
            .map(({ call_id }) => call_id);

        if (filteredCallIds.length === 0) {
            return res.responseInstance.handle({ call_logs: [] }, 200, ["No call history found."]);
        }

        const calls = await Call.findAll({
            where: { id: { [Op.in]: filteredCallIds } },
            include: [
                {
                    model: CallParticipant,
                    as: "call_participents",
                    include: [
                        {
                            model: User,
                            as: "user"
                        }
                    ]
                }
            ],
            order: [["createdAt", "DESC"]]
        });
        
        const callLogs = calls.map(call => {
            const isInitiator = call.user_id === user.id;
            
            const participant = Array.isArray(call.call_participents) 
                ? call.call_participents.find(p => p.user_id === user.id) 
                : null;

            const callStatus = participant
                ? (participant.is_received === 0 ? "missed" : "accepted")
                : "unknown";

            return {
                ...call.toJSON(),
                initiator: isInitiator,
                call_status: callStatus
            };
        });

        // return res.responseInstance.handle({ call_logs: callLogs }, 200, ["Request successful."]);
        return res.responseInstance.handle(helper.paginate(callLogs, page, limit, 'call_logs'), 200, ["Request successful."]);
    } catch (error) {
        return res.responseInstance.handle(null, 500, "An unexpected error occurred while processing your request.", error.message);
    }
};
export default {
    endCall,
    callHistory
}