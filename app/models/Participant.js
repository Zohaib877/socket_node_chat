import { Sequelize } from "sequelize";
import connection from "../../config/db.js";

const Participant = connection.define(
  "participants",
  {
    user_id: {
      type: Sequelize.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "cascade",
    },
    conversation_id: {
      type: Sequelize.BIGINT.UNSIGNED, // Match with conversations.id
      references: {
        model: 'conversations',
        key: 'id',
      },
      allowNull: false,
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    is_admin: {
      type: Sequelize.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    status: {
      type: Sequelize.TINYINT(1),
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

Participant.addHook("beforeUpdate", async (participant, options) => {
  await participant.update({ updatedAt: new Date() });
});
// Soft delete hook
Participant.addHook("beforeDestroy", async (participant, options) => {
  await participant.update({ deletedAt: new Date() });
});

export default Participant;
