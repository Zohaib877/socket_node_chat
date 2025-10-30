import { DataTypes, ENUM, Sequelize } from "sequelize";
import connection from "../../config/db.js";
import User from "./Users.js";

const Message = connection.define(
  "messages",
  {
    user_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      references: {
        model: User,
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "cascade",
    },
    conversation_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      references: {
        model: 'conversations',
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "cascade",
    },
    is_event: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    media_type: {
      type: ENUM,
      values: ["image", "video", "voice", "docs"],
      allowNull: true,
    },
    media: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    object_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    object_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.TINYINT(1),
      allowNull: true,
    },
    view_for: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleted_for: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    underscored: true,
    timestamps: true,
    paranoid: true,
  }
);

Message.addHook("beforeUpdate", async (message, options) => {
  await message.update({ updatedAt: new Date() });
});
// Soft delete hook
Message.addHook("beforeDestroy", async (message, options) => {
  await message.update({ deletedAt: new Date() });
});

export default Message;