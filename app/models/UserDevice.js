import Sequelize from 'sequelize';
import connection from '../../config/db.js';

const UserDevice = connection.define('user_devices', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
    },
    device_token: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    device_type: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    device_brand: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    device_os: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    app_version: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    udid: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    access_token: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    voip_token: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    is_notify: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

UserDevice.addHook("beforeUpdate", async (user_device, options) => {
    await user_device.update({ updatedAt: new Date() });
});
  
UserDevice.addHook("beforeDestroy", async (user_device, options) => {
    await user_device.update({ deletedAt: new Date() });
});

export default UserDevice;

