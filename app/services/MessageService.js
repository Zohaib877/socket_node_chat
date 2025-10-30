import { Op, Sequelize } from "sequelize";
import {
  Conversation,
  Message,
  User,
  UserDevice,
  participant,
} from "../models/init.js";
import { v4 as uuidv4 } from "uuid";
import {
  sendAPNSNotification,
  sendFCMNotification,
} from "../../helpers/notification.js";
import Participant from "../models/Participant.js";

async function create(params, socket) {
  const user_id = socket.user.id;
  params.user_id = user_id;
  params.view_for = user_id;

  await participant.restore({
    where: { conversation_id: params.conversation_id },
  });

  const userIds = await getConversationById(params.conversation_id, user_id);

  const participantUserIds = userIds.map((p) => `user-${p.user_id}`);
  const participantUserId = userIds.map((p) => p.user_id);

  const message = await Message.create(params);
  // const result = await responseMessage(
  //   user_id,
  //   params.conversation_id,
  //   message.id
  // );

  await userIds.map(async (p) => {
    const result = await responseMessage(
      p.user_id,
      params.conversation_id,
      message.id
    );

    socket.to(participantUserIds).emit("message", result);
  });

  const userDevices = await UserDevice.findAll({
    where: { user_id: { [Op.in]: participantUserId } },
    attributes: ["device_type", "voip_token", "device_token", "access_token"],
  });

  const conversation = await Conversation.findOne({
    where: { id: params.conversation_id },
    attributes: ["id", "title", "conversation_type"],
  });

  const participantDetails = await participant.findAll({
    where: {
      conversation_id: conversation.id,
      user_id: {
        [Sequelize.Op.not]: user_id,
      },
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "profile_image", "full_name", "phone"],
      },
    ],
  });

  console.log("userIds", participantUserId);

  await Promise.all(
    userDevices.map(async (device) => {
      const notificationData = {
        title: "New Message",
        body: `${socket.user.full_name} sent message.`,
        object_id: String(device.user_id),
        actor_id: String(socket.user.id),
        actor_type: "AppModelsUser",
        type: "new_message",
        object: "new_message",
        data: {
          user_id: String(socket.user.id),
          user_name: `${socket.user.full_name}`,
          user_image: String(socket.user.profile_image),
          body: String(params.body),
          media_type: String(params.media_type || ""),
          conversation_id: String(params.conversation_id),
          type: "new_message",
          conversation_type: String(conversation.conversation_type),
          participents: JSON.stringify(participantDetails),
        },
      };
      console.log("notificationData", notificationData);

      if (device.device_token) {
        console.log(device.device_token);
        await sendFCMNotification(device.device_token, notificationData);
      }
      // sendFCMNotification(device.device_token, notificationData);
    })
  );
}

async function remove(params, socket) {
  const userId = socket.user.id;
  const messageId = params?.id;
  const message = await Message.findByPk(messageId);
  const dmessage = message;

  if (!message) {
    console.error(`Message with ID ${messageId} not found`);
    return;
  }

  const result = await responseMessage(
    userId,
    dmessage.conversation_id,
    messageId
  );

  if (message.user_id === userId) {
    await message.destroy();
  } else {
    let deletedForUsers = message.deleted_for
      ? message.deleted_for.split(",").map(Number)
      : [];

    if (!deletedForUsers.includes(userId)) {
      deletedForUsers.push(userId);
      message.deleted_for = deletedForUsers.join(",");
      await message.save();
    }
  }

  socket.to(`group-${dmessage.conversation_id}`).emit("delete-message", result);
}

const responseMessage = async (userId, conversation_id, message_id) => {
  console.log("userId", userId);
  console.log("conversation_id", conversation_id);
  console.log("message_id", message_id);

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
    order: [["id", "DESC"]],
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

  let participant_user = await participant.findAll({
    where: {
      conversation_id: conversation.id,
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
  });

  const unreadCount = await Message.count({
    where: {
      conversation_id: conversation_id,
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

  console.log("unreadCount", unreadCount);

  return {
    ...conversation.toJSON(),
    participants: participant_user,
    latestMessage,
    unread: unreadCount,
  };
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
    ],
    order: [["id", "DESC"]],
  });

  let participantUsers = await participant.findAll({
    where: {
      conversation_id: conversation.id,
      user_id: {
        [Sequelize.Op.not]: userId,
      },
    },
    attributes: ["user_id"],
  });

  // const participantUserIds = participantUsers.map(p => `user-${p.user_id}`);

  return participantUsers;
};

export default {
  create,
  remove,
};
