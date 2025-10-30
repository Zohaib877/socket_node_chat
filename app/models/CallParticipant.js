import Sequelize from 'sequelize';
import connection from '../../config/db.js';
import User from './Users.js';
import Call from './Call.js';

const CallParticipant = connection.define('call_participants', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    call_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: {
            model: Call,
            key: "id",
        },
        onUpdate: "cascade",
        onDelete: "cascade",
    },
    user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: {
            model: User,
            key: "id",
        },
        onUpdate: "cascade",
        onDelete: "cascade",
    },
    duration: {
        type: Sequelize.STRING,
        defaultValue: 1
    },
    is_received: {
        type: Sequelize.TINYINT(2),
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

CallParticipant.addHook('beforeUpdate', async (call_participants, options) => {
    await call_participants.update({ updatedAt: new Date() });
});
// Soft delete hook
CallParticipant.addHook('beforeDestroy', async (call_participants, options) => {
    await call_participants.update({ deletedAt: new Date() });
});

export default CallParticipant;
