import Sequelize from 'sequelize';
import connection from '../../config/db.js';

const Conversation = connection.define('conversations', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "cascade",
        onDelete: "cascade",
    },
    conversation_type: {
        type: Sequelize.ENUM(['private', 'group']),
        defaultValue: 'private'
    },
    title: {
        type: Sequelize.STRING,
        defaultValue: 1
    },
    description:{
        type: Sequelize.STRING,
        defaultValue: 1
    },
    image:{
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
        type: Sequelize.TINYINT(1),
        defaultValue: 0
    },
    theme: {
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
}, {
    underscored: true,
    timestamps: true,
    paranoid: true,
});

Conversation.addHook('beforeUpdate', async (conversation, options) => {
    await conversation.update({ updatedAt: new Date() });
});
// Soft delete hook
Conversation.addHook('beforeDestroy', async (conversation, options) => {
    await conversation.update({ deletedAt: new Date() });
});

export default Conversation;
