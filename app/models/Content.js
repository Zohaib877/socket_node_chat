import Sequelize from "sequelize";
import connection from "../../config/db.js";

const Content = connection.define(
  "contents",
  {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    slug: {
      type: Sequelize.STRING,
      defaultValue: 1,
    },
    media: {
      type: Sequelize.STRING,
      defaultValue: 1,
    },
    description: {
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

Content.addHook("beforeUpdate", async (content, options) => {
  await content.update({ updatedAt: new Date() });
});

Content.addHook("beforeDestroy", async (content, options) => {
  await content.update({ deletedAt: new Date() });
});

export default Content;
