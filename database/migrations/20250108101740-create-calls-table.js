export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('calls', {
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
  await queryInterface.dropTable('calls');
}
