import Sequelize from 'sequelize';
import connection from '../../config/db.js';

const User = connection.define('users', {
  id: {
    type: Sequelize.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  bio: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true
  },
  profile_image: {
    type: Sequelize.STRING,
    allowNull: true
  },
  language: {
    type: Sequelize.STRING,
    allowNull: true
  },
  otp: {
    type: Sequelize.STRING,
    allowNull: true
  },
  expired_at:{
    type: Sequelize.TINYINT(1),
    defaultValue: 1
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
}, {
  underscored: true,
  timestamps: true,
  paranoid: true,
});

User.addHook("beforeUpdate", async (user, options) => {
  await user.update({ updatedAt: new Date() });
});

User.addHook("beforeDestroy", async (user, options) => {
  await user.update({ deletedAt: new Date() });
});

export default User;
