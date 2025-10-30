import Sequelize from "sequelize";
import connection from "../../config/db.js";

const Invite = connection.define(
  "invites",
  {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "set null",
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      defaultValue: 1,
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

// BlockUser.user  = BlockUser.belongsTo(User, { as: 'users', foreignKey: 'user_id' });

Invite.addHook("beforeUpdate", async (invite, options) => {
  await invite.update({ updatedAt: new Date() });
});

Invite.addHook("beforeDestroy", async (invite, options) => {
  await invite.update({ deletedAt: new Date() });
});

export default Invite;
