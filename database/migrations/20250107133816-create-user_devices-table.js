export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('user_devices', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    user_id: {
      type: Sequelize.DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: false,
      onUpdate: "cascade",
      onDelete: "cascade",
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
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      type: Sequelize.DATE,
    },
    updated_at: {
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      type: Sequelize.DATE,
    },
    deleted_at: {
      allowNull: true,
      type: Sequelize.DATE,
    },
  });
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('invites');
}
