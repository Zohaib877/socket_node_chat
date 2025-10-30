import Sequelize from 'sequelize';
import connection from '../../config/db.js';
import User from './Users.js';

const Call = connection.define('calls', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
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
    // receiver_id: {
    //     type: Sequelize.BIGINT.UNSIGNED,
    //     references: {
    //       model: User,
    //       key: "id",
    //     },
    //     onUpdate: "cascade",
    //     onDelete: "cascade",
    // },
    duration: {
        type: Sequelize.STRING,
        defaultValue: 1
    },
    session_id: {
        type: Sequelize.STRING,
        defaultValue: 1
    },
    conversation_id: {
        type: Sequelize.STRING,
        defaultValue: 1
    },
    is_video: {
        type: Sequelize.TINYINT(1),
        defaultValue: 1
    },
    is_group: {
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

Call.addHook('beforeUpdate', async (call, options) => {
    await call.update({ updatedAt: new Date() });
});
// Soft delete hook
Call.addHook('beforeDestroy', async (call, options) => {
    await call.update({ deletedAt: new Date() });
});

export default Call;
