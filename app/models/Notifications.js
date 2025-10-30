import { Sequelize } from "sequelize";
import connection from "../../config/db.js";
import User from "./Users.js";

const Notification = connection.define(
  "activities",
  {
    user_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "cascade",
    },
    user_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    body: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    object_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    object_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    actor_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    is_viewed: {
      type: Sequelize.TINYINT(1),
      allowNull: true,
      default: 0
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

Notification.User = Notification.belongsTo(User, {
  foreignKey: "user_id",
});

Notification.actor = Notification.belongsTo(User, {
  foreignKey: "actor_id",
});

Notification.addHook("beforeUpdate", async (message, options) => {
  await message.update({ updatedAt: new Date() });
});
// Soft delete hook
Notification.addHook("beforeDestroy", async (message, options) => {
  await message.update({ deletedAt: new Date() });
});

export default Notification;
