import { Op, Sequelize } from "sequelize";
import helpers from "../../helpers/helpers.js";
import { User, Conversation, participant, Message } from "../models/init.js";
import sequelize from "../../config/db.js";
import media from "../../utils/media.js";

const getSingleConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const searchName = req.query.name;
    console.log("--------------> Search param <--------------", searchName);

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          status: 1,
          user_id: userId,
        },
      },
      include: [
        {
          model: participant,
          where: {
            user_id: userId,
          },
        },
        {
          model: User,
          as: "users",
        },
        {
          model: Message,
          as: 'messages',
          attributes: [] // Exclude message attributes from the result
        },
      ],
      order: [
        [Message, 'id', 'DESC'], // Order by message ID DESC
        ['id', 'DESC'] // Then order by conversation ID DESC
      ],
      // order: [["id", "ASC"]],
    });

    let totalUnreadCount = 0;

    const conversationDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const latestMessage = await Message.findOne({
          where: {
            conversation_id: conversation.id,
          },
          include: [
            {
              model: User,
              as: "user",
            },
          ],
          order: [["created_at", "DESC"]],
        });

        let participant_user = await participant.findAll({
          where: {
            conversation_id: conversation.id,
            // user_id: userId
            // user_id: {
            //   [Sequelize.Op.not]: userId,
            // },
          },
          include: [
            {
              model: User,
              as: "user",
            },
          ],
          paranoid: false, // Ignore soft delete
          required: false,
        });
        if (!participant_user) return null;

        const unreadCount = await Message.count({
          where: {
            conversation_id: conversation.id,
            // [Sequelize.Op.and]: [
            //   {
            //     [Sequelize.Op.or]: [
            //       { view_for: null },
            //       Sequelize.literal(`NOT FIND_IN_SET('${userId}', view_for)`),
            //     ],
            //   },
            // ],
            [Sequelize.Op.and]: [
              Sequelize.literal(`NOT FIND_IN_SET('${userId}', view_for)`),
            ],
          },
        });

        totalUnreadCount += unreadCount;

        return {
          ...conversation.toJSON(),
          participants: participant_user,
          latestMessage,
          unread: unreadCount,
        };
      })
    );

    const filteredConversationDetails = conversationDetails.filter(
      (conversation) => conversation !== null
    );

    const conversationPaginated = helpers.paginate(filteredConversationDetails, req.query.page, req.query.limit);

    return res.responseInstance.handle(conversationPaginated, 200);
    // return res.responseInstance.handle(
    //   { totalUnreadCount, result: [...filteredConversationDetails] },
    //   200
    // );
  } catch (error) {
    if (!res.headersSent) {
      return res.responseInstance.handle(
        null,
        500,
        ["An unexpected error occurred while proceeding your request."],
        error.message
      );
    } else {
      console.error("Error occurred after response sent:", error);
    }
  }
};

const createPrivateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body;
    const transaction = await sequelize.transaction();
    const io = req.app.get("socket");
    let ParticipantUser = payload.users.split(",").map(Number);
    let ParticipantUsers = payload.users.split(",").map(Number);
    let type = "private";
    let conversation;

    ParticipantUsers.push(userId);

    const existingConversation = await participant.findOne({
      attributes: ["conversation_id"],
      where: {
        user_id: {
          [Op.in]: ParticipantUsers,
        },
      },
      paranoid: false, // Ignore soft delete
      required: false,
      group: ["conversation_id"],
      having: sequelize.literal("COUNT(DISTINCT user_id) = 2"),
    });

    if (existingConversation) {
      conversation = await Conversation.findOne({
        where: {
          id: existingConversation.conversation_id,
          conversation_type: type,
        },
      });

      await participant.restore({
        where: { conversation_id: existingConversation.conversation_id },
      });
    }

    if (
      !conversation ||
      !conversation.dataValues ||
      !conversation.dataValues.id
    ) {
      conversation = await Conversation.create(
        {
          user_id: userId,
          conversation_type: type,
          status: 1,
        },
        { transaction }
      );

      const message = await Message.create(
        {
          user_id: userId,
          conversation_id: conversation.dataValues.id,
          is_event: true,
          body: `${req.user.full_name} started the conversation`,
        },
        { transaction }
      );

      await Promise.all(
        ParticipantUsers.map(async (id) => {
          await participant.create(
            {
              conversation_id: conversation.id,
              user_id: id,
              is_admin: userId == id ? true : false,
            },
            { transaction }
          );
        })
      );
      await transaction.commit();

      const SocketResult = await responseMessage(
        userId,
        conversation.id,
        message.id
      );

      io.to("user-" + ParticipantUser).emit("message", SocketResult);
    }

    let result = await getConversationById(conversation.id, userId);

    return res.responseInstance.handle({ new_conversation: result }, 200);
  } catch (error) {
    if (!res.headersSent) {
      return res.responseInstance.handle(
        null,
        500,
        ["An unexpected error occurred while proceeding your request."],
        error.message
      );
    } else {
      console.error("Error occurred after response sent:", error);
    }
  }
};

const createGroupConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body;
    const transaction = await sequelize.transaction();
    const io = req.app.get("socket");
    let type = "group";

    if (!payload.title) {
      return res.responseInstance.handle(null, 422, [
        "Group title is required",
      ]);
    }

    let image = null;
    if (req?.files?.image != null) {
      image = await media.uploadMediaWithFallback(req, "conversation", "image", process.env.USE_S3_UPLOAD === "true");
    }

    const conversation = await Conversation.create(
      {
        user_id: userId,
        conversation_type: type,
        title: payload.title,
        description: payload.description || "",
        image: image,
        status: 1,
      },
      { transaction }
    );

    const message = await Message.create(
      {
        user_id: userId,
        conversation_id: conversation.id,
        is_event: true,
        body: `${req.user.full_name} created the group`,
      },
      { transaction }
    );

    const userIds = payload.users.split(",").map(Number);
    userIds.push(userId);

    await Promise.all(
      userIds.map(async (id) => {
        await participant.create(
          {
            conversation_id: conversation.id,
            user_id: id,
            is_admin: userId == id ? true : false,
          },
          { transaction }
        );
      })
    );

    await transaction.commit();

    const SocketResult = await responseMessage(
      userId,
      conversation.id,
      message.id
    );

    userIds.forEach((id) => {
      io.to("user-" + id).emit("message", SocketResult);
    });

    let result = await getConversationById(conversation.id, userId);

    return res.responseInstance.handle({ new_conversation: result }, 200);
  } catch (error) {
    if (!res.headersSent) {
      return res.responseInstance.handle(
        null,
        500,
        ["An unexpected error occurred while proceeding your request."],
        error.message
      );
    } else {
      console.error("Error occurred after response sent:", error);
    }
  }
};

const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const is_participent = await participant.findOne({
      where: {
        user_id: userId,
        conversation_id: id,
      },
    });

    if (!is_participent) {
      return res.responseInstance.handle(null, 422, [
        "You're not a part of this conversation.",
      ]);
    }

    await participant.destroy({
      where: {
        conversation_id: id,
        user_id: userId,
      },
    });

    const messages = await Message.findAll({
      where: {
        conversation_id: id,
      },
    });

    await messages.map(async (msg) => {
      let deleted = msg.dataValues.deleted_for
        ? msg.dataValues.deleted_for.split(",").map(Number)
        : [];
      if (deleted.indexOf(userId) === -1) {
        deleted.push(userId);
        await Message.update(
          {
            deleted_for: deleted.toString(),
          },
          {
            where: {
              id: msg.id,
            },
          }
        );
      }
      return msg;
    });

    await Message.create({
      user_id: userId,
      conversation_id: id,
      is_event: true,
      body: `${req.user.full_name} has Left`,
    });

    res.responseInstance.handle(null, 200);
  } catch (error) {
    //   return res.responseInstance.handle(null, 500, "An unexpected error occurred while proceeding your request.", error.message);
    if (!res.headersSent) {
      return res.responseInstance.handle(
        null,
        500,
        ["An unexpected error occurred while proceeding your request."],
        error.message
      );
    } else {
      console.error("Error occurred after response sent:", error);
    }
  }
};

const joinConversation = async (req, res) => {
  const conversation_id = req.params.id;
  const payload = req.body;
  try {
    const conversation = await Conversation.findOne({
      where: { id: conversation_id },
    });
    if (!conversation) {
      return res.responseInstance.handle(null, 422, ["Conversation not found"]);
    }
    const users = payload.users.split(",");
    // const users = JSON.parse(payload.users);
    await Promise.all(
      users.map(async (id) => {
        const JoinedUser = await User.findByPk(id);
        const ExistedUser = await participant.findAll({
          where: {
            conversation_id: conversation_id,
            user_id: id,
          },
        });
        if (ExistedUser.length == 0) {
          await participant.create({
            conversation_id: conversation_id,
            user_id: id,
            is_admin: false,
          });

          const message = await Message.create({
            user_id: id,
            conversation_id: conversation_id,
            is_event: true,
            body: `${JoinedUser.full_name} has joined`,
          });

          const result = await responseMessage(id, conversation_id, message.id);
          const io = req.app.get("socket");

          const userSocket = Array.from(io.sockets.sockets.values()).find(
            (s) => "user-" + s.user.id === "user-" + id
          );
          if (userSocket) {
            userSocket.join(`group-${conversation_id}`);
          }

          io.to("group-" + conversation_id).emit("message", result);
        }
      })
    );
    return res.responseInstance.handle(conversation, 200);
  } catch (err) {
    // return res.responseInstance.handle(null, 500, "An unexpected error occurred while proceeding your request.", err.message);
    if (!res.headersSent) {
      return res.responseInstance.handle(
        null,
        500,
        ["An unexpected error occurred while proceeding your request."],
        err.message
      );
    } else {
      console.error("Error occurred after response sent:", error);
    }
  }
};

const updateGroupConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const payload = req.body;

    const conversation = await Conversation.findOne({
      where: { id: id, user_id: userId },
    });

    if (!conversation) {
      return res.responseInstance.handle(null, 422, [
        "Conversation not found or you are not the owner.",
      ]);
    }

    let image = null;
    if (req?.files?.image != null) {
      image = await media.uploadMediaWithFallback(req, "conversation", "image", process.env.USE_S3_UPLOAD === "true");
    }

    if (image) {
      payload.image = image;
    }

    await Conversation.update(payload, { where: { id: id } });

    let result = await getConversationById(conversation.id, userId);

    return res.responseInstance.handle({ conversation: result }, 200);
  } catch (error) {
    // return res.responseInstance.handle(null, 500, "An unexpected error occurred while proceeding your request.", error.message);
    if (!res.headersSent) {
      return res.responseInstance.handle(
        null,
        500,
        ["An unexpected error occurred while proceeding your request."],
        error.message
      );
    } else {
      console.error("Error occurred after response sent:", error);
    }
  }
};

const leaveGroupConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const is_participent = await participant.findOne({
      where: {
        user_id: userId,
        conversation_id: id,
      },
    });

    if (!is_participent) {
      return res.responseInstance.handle(null, 422, [
        "You're not a part of this conversation.",
      ]);
    }

    await participant.destroy({
      where: {
        conversation_id: id,
        user_id: userId,
      },
    });

    const messages = await Message.findAll({
      where: {
        conversation_id: id,
      },
    });

    await messages.map(async (msg) => {
      let deleted = msg.dataValues.deleted_for
        ? msg.dataValues.deleted_for.split(",").map(Number)
        : [];
      if (deleted.indexOf(userId) === -1) {
        deleted.push(userId);
        await Message.update(
          {
            deleted_for: deleted.toString(),
          },
          {
            where: {
              id: msg.id,
            },
          }
        );
      }
      return msg;
    });

    await Message.create({
      user_id: userId,
      conversation_id: id,
      is_event: true,
      body: `${req.user.full_name} has Left`,
    });

    return res.responseInstance.handle(null, 200);
  } catch (error) {
    // return res.responseInstance.handle(null, 500, "An unexpected error occurred while proceeding your request.", error.message);
    if (!res.headersSent) {
      return res.responseInstance.handle(
        null,
        500,
        ["An unexpected error occurred while proceeding your request."],
        error.message
      );
    } else {
      console.error("Error occurred after response sent:", error);
    }
  }
};

const getConversationById = async (id, userId) => {
  const conversation = await Conversation.findOne({
    where: {
      id: id,
    },
    include: [
      {
        model: participant,
      },
      {
        model: User,
        as: "users",
      },
    ],
    order: [["id", "DESC"]],
  });

  const latestMessage = await Message.findOne({
    where: {
      conversation_id: conversation.id,
    },
    include: [
      {
        model: User,
        as: "user",
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const unreadCount = await Message.count({
    where: {
      conversation_id: conversation.id,
      [Sequelize.Op.and]: [
        {
          [Sequelize.Op.or]: [
            { view_for: null },
            Sequelize.literal(`NOT FIND_IN_SET('${userId}', view_for)`),
          ],
        },
      ],
    },
  });

  return {
    ...conversation.toJSON(),
    // participants: participant_user,
    latestMessage,
    unread: unreadCount,
  };
};

const responseMessage = async (userId, conversation_id, message_id) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversation_id,
    },
    include: [
      {
        model: participant,
      },
      {
        model: User,
        as: "users",
      },
    ],
  });

  const latestMessage = await Message.findOne({
    where: {
      id: message_id,
    },
    include: [
      {
        model: User,
        as: "user",
      },
    ],
  });

  let participantsQuery;
  if (conversation?.conversation_type === "private") {
    participantsQuery = participant.findAll({
      where: {
        conversation_id: conversation.id,
        // user_id: { [Sequelize.Op.ne]: userId },
      },
      include: [
        {
          model: User,
          as: "user",
        },
      ],
    });
  } else {
    participantsQuery = participant.findAll({
      where: {
        conversation_id: conversation_id,
        // user_id: { [Sequelize.Op.ne]: userId },
      },
      include: [
        {
          model: User,
          as: "user",
        },
      ],
    });
  }

  const participant_user = await participantsQuery;

  const unreadCount = await Message.count({
    where: {
      conversation_id: conversation.id,
      [Sequelize.Op.and]: [
        {
          [Sequelize.Op.or]: [
            { view_for: null },
            Sequelize.literal(`NOT FIND_IN_SET('${userId}', view_for)`),
          ],
        },
      ],
    },
  });

  return {
    ...conversation.toJSON(),
    participants: participant_user,
    latestMessage,
    unread: unreadCount,
  };
};

export default {
  getSingleConversations,
  createPrivateConversation,
  createGroupConversation,
  joinConversation,
  updateGroupConversation,
  leaveGroupConversation,
  deleteConversation,
};
