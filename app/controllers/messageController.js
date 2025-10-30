import helpers from '../../helpers/helpers.js';
import { User, Conversation, participant, Message } from "../models/init.js";
import _ from 'lodash';

const getmessages = async (req, res) => {
    let id = req.params.id;
    const userId = req.user.id;
    try {
        const conversation = await Conversation.findOne({
            where: { id: id },
            include: [
                {
                    model: participant,
                    include: [
                        {
                            model: User,
                            as: 'user',
                        }
                    ],
                    paranoid: false, // Ignore soft delete
                    required: false,
                },
                {
                    model: User,
                    as: 'users',
                }
            ],
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found.' });
        }
        const allmessages = await Message.findAll({
            where: {
                conversation_id: conversation.id,
                // status: 1
            },
            include: [
                {
                    model: User,
                    as: "user",
                },
            ],
            order: [["created_at", "DESC"]],
        });

        const messages = await Promise.all(allmessages.map(async (msg) => {
            let views = msg.dataValues.view_for ? msg.dataValues.view_for.split(',').map(Number) : [];
            if (views.indexOf(userId) === -1) {
                views.push(userId);
                await Message.update({
                    view_for: views.toString()
                }, {
                    where: {
                        id: msg.id
                    }
                });
            }

            let deleted = msg.dataValues.deleted_for ? msg.dataValues.deleted_for.split(',').map(Number) : [];
            if (deleted.indexOf(userId) !== -1) {
                return null;
            } else {
                return msg;
            }
        }));

        const filter_messages = messages.filter(message => message !== null);
        // const messagesPaginated = helpers.paginate(filter_messages, req.query.page, req.query.limit, "messages");

        return res.responseInstance.handle({ conversation, filter_messages }, 200);
    } catch (err) {
        return res.responseInstance.handle(null, 500, ["An unexpected error occurred while proceeding your request."], err.message);
    }
};

// const updatemessage = async (req, res) => {
//     const body  = req.body;
//     const id    = req.params.id;
//     const { error, value } = messageEditValidationSchema.validate(body);
//     if (error) {
//         return res.status(500).json({
//             status: "error",
//             message: "Validation Error.",
//             data: null,
//             trace: error.details
//         });
//     }

//     const message = await Message.findByPk(id);
//     if (!message) return res.status(404).json({
//         status: "error",
//         message: "Couldn't find any message against this id."
//     });

//     message.update(body);
//     return res.json({
//         status: "success",
//         message: "Message Edit!",
//         data: message
//     });
// }

// const deletemessage = async (req, res) => {
//     const id            = req.params.id;
//     const user_id       = req.user.id;
//     const message       = await Message.findByPk(id);
//     if (!message) {
//       const result = responseHelper.handle(null, 422, ["Message ID Not Found!"]);
//       return ctx.response.status(result.code).send(result.response);
//     }

//     if (message.user_id !== user_id) {
//       let deleted = [];
//       if (message.deleted_for) {
//         deleted = message.deleted_for.split(',').map(Number);
//       }

//       if (!deleted.includes(user_id)) {
//         deleted.push(user_id);
//         message.deleted_for = deleted.join(',');
//         await message.save();
//       }
//     } else {
//       await message.delete();
//     }
//     return res.json({
//         status: "success",
//         message: "Message Deleted!",
//         data: messagedetail
//     });
// }

export default {
    getmessages,
}