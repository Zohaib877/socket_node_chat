import { Op, Sequelize } from "sequelize";
import { sendFCMNotification, sendAPNSNotification } from "../../helpers/notification.js";
import { Call, CallParticipant, Conversation, Message, participant, User, UserDevice } from "../models/init.js";
import { v4 as uuidv4 } from 'uuid';
import sequelize from "sequelize";

async function initiate(params, socket) {
    const user = socket.user;
    const call = await Call.create({
        user_id: user.id,
        session_id: params.session_id,
        is_video: params.is_video,
        conversation_id: params.conversation_id,
        is_group: params.is_group,
    });

    let participantUserIds = params.users.split(",").map(Number);
    let participantUserId = params.users.split(",").map(Number);

    const userDevices = await UserDevice.findAll({
        where: { user_id: { [Op.in]: participantUserIds } },
        attributes: ['user_id', 'device_type', 'voip_token', 'device_token', 'access_token'],
    });

    participantUserId.push(user.id);

    const callParticipants = participantUserId.map((id) => ({
        call_id: call.id,
        user_id: id,
        duration: 0,
        is_received: 0,
    }));
    await CallParticipant.bulkCreate(callParticipants);

    await CallParticipant.update({
        is_received: 1
    }, {
        where: {
            call_id: call.id,
            user_id: user.id
        }
    });

    const participantRooms = participantUserIds.map(id => `user-${id}`);

    socket.emit('calling', { ...call.toJSON(), user });
    socket.to(participantRooms).emit('calling', { ...call.toJSON(), user });

    const participents = await CallParticipant.findAll({
        where: {
            call_id: call.id
        },
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "profile_image", "full_name", "phone"]
            }
        ]
    });

    await Promise.all(
        userDevices.map((device) => {
            const notificationData = {
                title: 'Calling',
                body: `${user.full_name} is calling you.`,
                object_id: String(device.user_id),
                actor_id: String(user.id),
                actor_type: 'App\Models\User',
                type: 'incoming_call',
                object: 'incoming_call',
                data: {
                    caller_id: String(user.id),
                    caller_name: `${user.full_name}`,
                    caller_image: String(user.profile_image),
                    conversation_id: String(call.conversation_id),
                    is_video: String(call.is_video) ?? '0',
                    type: 'incoming_call',
                    uuid: uuidv4(),
                    params: JSON.stringify(params),
                    participents: JSON.stringify(participents),
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
                        "aps": { "content-available": "1" },
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
                            "type": 'incoming_call',
                            "object": 'incoming_call',
                        },
                        "type": 'incoming_call',
                        "caller_name": `${user.full_name}`,
                        "caller_id": String(user.id),
                        "caller_image": String(user.profile_image),
                        "conversation_id": String(call.conversation_id),
                        "is_video": String(call.is_video),
                        "uuid": uuidv4(),
                        "params": params,
                        "participents": participents,
                    },
                })
                : Promise.resolve();

            return Promise.all([fcmPromise, apnsPromise]);
        })
    );

}

async function join(params, socket) {
    const user = socket.user;
    const sessionId = params?.id;
    const status = params?.status;

    const call = await Call.findOne({
        where: { session_id: sessionId }
    });
    // await Message.create(
    //     {
    //         user_id: user.id,
    //         conversation_id: call.conversation_id,
    //         is_event: true,
    //         body: `${user.full_name} join`,
    //     },
    // );
    await CallParticipant.update({
        is_received: status
    }, {
        where: {
            call_id: call.id,
            user_id: user.id
        }
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
    });

    const IOuserIds = participents.map(p => `user-${p.user_id}`);
    if (call) {
        const callWithParticipants = {
            ...call.toJSON(),
            user,
            participents
        };
        socket.emit('join_call', callWithParticipants);
        socket.to(IOuserIds).emit('join_call', callWithParticipants);
    }
}

async function end(params, socket) {
    const user = socket.user;
    const sessionId = params?.id;
    const duration = params?.duration;
    const status = params?.status;

    const call = await Call.findOne({
        where: { session_id: sessionId }
    });

    const result = await Call.findOne({
        where: { session_id: sessionId },
        attributes: [[Sequelize.literal("TIMEDIFF(NOW(), created_at)"), "calculated_duration"]],
        raw: true
    });

    if (result && result.calculated_duration) {
        const durationString = result.calculated_duration.toString();
        await Call.update(
            { duration: durationString },
            { where: { session_id: sessionId } }
        );
    }
    await CallParticipant.update(
        {
            duration: duration,
            is_received: status
        },
        {
            where: {
                call_id: call.id,
                user_id: user.id
            }
        }
    );
    await CallParticipant.update(
        {
            duration: duration,
        },
        {
            where: {
                call_id: call.id,
                is_received: 1
            }
        }
    );
    const participents = await CallParticipant.findAll({
        where: {
            call_id: call.id
        },
        attributes: ["id", "user_id", "duration", "is_received"],
        include: [{
            model: User,
            as: "user",
            attributes: ["id", "profile_image", "full_name", "phone"]
        }]
    });

    const userIdsCommaSeparated = participents.map(p => p.user_id);

    const allparticipentsdb = await CallParticipant.findAll({
        where: {
            call_id: call.id
        },
        attributes: ["id", "user_id", "duration", "is_received"],
    });
    const allparticipents = allparticipentsdb.map(p => p.user_id);

    if (call.is_group !== 1) {
        let conversation;
        const existingConversation = await participant.findOne({
            attributes: ['conversation_id'],
            where: {
                user_id: {
                    [Op.in]: userIdsCommaSeparated,
                },
            },
            paranoid: false, // Ignore soft delete
            required: false,
            group: ['conversation_id'],
            having: sequelize.literal('COUNT(DISTINCT user_id) = 2'),
        });

        if (existingConversation) {
            conversation = await Conversation.findOne({
                where: {
                    id: existingConversation.conversation_id,
                    conversation_type: 'private',
                },
            });

            await participant.restore({
                where: { conversation_id: existingConversation.conversation_id }
            });
        }
        if (!conversation || !conversation.dataValues || !conversation.dataValues.id) {
            conversation = await Conversation.create({
                user_id: user.id,
                conversation_type: 'private',
                status: 1,
            });
            await Promise.all(
                allparticipents.map(async (id) => {
                    await participant.create(
                        {
                            conversation_id: conversation.dataValues.id,
                            user_id: id,
                            is_admin: user.id == id ? true : false,
                        }
                    );
                })
            );
            await Message.create(
                {
                    user_id: user.id,
                    conversation_id: conversation.dataValues.id,
                    is_event: true,
                    body: call.duration == 1
                        ? (call.is_video == 0 ? 'Missed Audio Call' : 'Missed Video Call')
                        : (call.is_video == 0 ? 'Ended Audio Call' : 'Ended Video Call'),
                },
            );
        } else {
            await Message.create(
                {
                    user_id: user.id,
                    conversation_id: existingConversation?.conversation_id,
                    is_event: true,
                    body: call.duration == 1
                        ? (call.is_video == 0 ? 'Missed Audio Call' : 'Missed Video Call')
                        : (call.is_video == 0 ? 'Ended Audio Call' : 'Ended Video Call'),
                },
            );
        }
    }
    const IOuserIds = participents.map(p => `user-${p.user_id}`);

    if (call) {
        const callWithParticipants = {
            ...call.toJSON(),
            user,
            participents
        };
        socket.emit('end_call', callWithParticipants);
        socket.to(IOuserIds).emit('end_call', callWithParticipants);
    }
}

async function finish(params, socket) {
    const user = socket.user;
    const sessionId = params?.id;

    const call = await Call.findOne({
        where: { session_id: sessionId }
    });

    if (!call) {
        return;
    }

    const participents = await CallParticipant.findAll({
        where: {
            call_id: call.id
        },
        attributes: ["id", "user_id", "duration", "is_received"],
        include: [{
            model: User,
            as: "user",
            attributes: ["id", "profile_image", "full_name", "phone"]
        }]
    });
    const filteredParticipants = participents.filter(p => p.user_id !== user.id);
    const userIdsCommaSeparated = filteredParticipants.map(p => p.user_id);
    const IOuserIds = filteredParticipants.map(p => `user-${p.user_id}`);

    const allparticipentsdb = await CallParticipant.findAll({
        where: {
            call_id: call.id
        },
        attributes: ["id", "user_id", "duration", "is_received"],
    });
    const allparticipents = allparticipentsdb.map(p => p.user_id);
    // allparticipents.push(user.id);

    const userDevices = await UserDevice.findAll({
        where: { user_id: { [Op.in]: userIdsCommaSeparated } },
        attributes: ['device_type', 'voip_token', 'device_token', 'access_token'],
    });

    if (call) {
        const callWithParticipants = {
            ...call.toJSON(),
            user,
            participents
        };
        socket.emit('finish_call', callWithParticipants);
        socket.to(IOuserIds).emit('finish_call', callWithParticipants);
    }

    // Fetch or create conversation ID
    let conversation;
    const existingConversation = await participant.findOne({
        attributes: ['conversation_id'],
        where: {
            user_id: {
                [Op.in]: allparticipents,
            },
        },
        paranoid: false, // Ignore soft delete
        required: false,
        group: ['conversation_id'],
        having: sequelize.literal('COUNT(DISTINCT user_id) = 2'),
    });
    if (existingConversation) {
        conversation = await Conversation.findOne({
            where: {
                id: existingConversation.conversation_id,
                // conversation_type: 'private',
            },
        });

        await participant.restore({
            where: { conversation_id: existingConversation.conversation_id }
        });
    }

    if(call.duration === 1){
        if (!conversation || !conversation.dataValues || !conversation.dataValues.id) {
            conversation = await Conversation.create({
                user_id: user.id,
                conversation_type: 'private',
                status: 1,
            });
            await Promise.all(
                allparticipents.map(async (id) => {
                    await participant.create(
                        {
                            conversation_id: conversation.dataValues.id,
                            user_id: id,
                            is_admin: user.id == id ? true : false,
                        }
                    );
                })
            );
            await Message.create(
                {
                    user_id: user.id,
                    conversation_id: conversation.id,
                    is_event: true,
                    body: `${user.full_name} missed the call`,
                }
            );
        } else {
            await Message.create(
                {
                    user_id: user.id,
                    conversation_id: existingConversation.conversation_id,
                    is_event: true,
                    body: `${call.is_video == 0 ? 'Missed Audio Call' : 'Missed Video Call'}`,
                },
            );
        }
    }

    if(call.duration === 1){
        await Promise.all(
            userDevices.map((device) => {
                const notificationData = {
                    title: 'Missed Call',
                    body: `${user.full_name} missed the call.`,
                    object_id: String(params.id),
                    actor_id: String(user.id),
                    actor_type: 'App\Models\User',
                    type: 'finish_call',
                    object: 'finish_call',
                    data: {
                        caller_id: String(user.id),
                        caller_name: `${user.full_name}`,
                        caller_image: String(user.profile_image),
                        conversation_id: String(conversation.dataValues.id),
                        is_video: String(call.is_video),
                        type: 'finish_call',
                        uuid: uuidv4(),
                        params: JSON.stringify(params),
                        participents: JSON.stringify(participents),
                    },
                };

                let fcmPromise = Promise.resolve();

                if (device.device_type !== 'ios') {
                    fcmPromise = sendFCMNotification(device.device_token, notificationData);
                }

                const apnsPromise = device.device_type === 'ios'
                    ? sendAPNSNotification(device.voip_token, {
                        title: 'Missed Call',
                        body: 'You missed the call',
                        data: {
                            "aps": { "content-available": "1" }, // Ensure content-available is a string if required
                            "handle": "1111111",
                            "details": {
                                "caller_name": `${user.full_name}`,
                                "caller_id": String(user.id),
                                "user_id": String(params.id),
                                "id": String(params.id),
                                "body": 'You missed the call',
                                "object_id": String(params.id),
                                "actor_id": String(user.id),
                                "actor_type": 'App\Models\User',
                                "type": 'finish_call',
                                "object": 'finish_call',
                            },
                            "type": 'finish_call',
                            "caller_name": `${user.full_name}`,
                            "caller_id": String(user.id),
                            "caller_image": String(user.profile_image),
                            "conversation_id": String(conversation.dataValues.id),
                            "is_video": String(call.is_video),
                            "uuid": uuidv4(), // If uuid needs to be a string, ensure it's formatted as such.
                            "params": params, // If uuid needs to be a string, ensure it's formatted as such.
                            "participents": participents, // If uuid needs to be a string, ensure it's formatted as such.
                        },
                    })
                    : Promise.resolve();

                return Promise.all([fcmPromise, apnsPromise]);
            })
        );
    }
}

export default {
    initiate,
    join,
    end,
    finish
}