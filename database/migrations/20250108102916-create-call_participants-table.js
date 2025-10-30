export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('call_participants', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    call_id: {
      type: Sequelize.DataTypes.INTEGER,
      references: {
        model: "calls",
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "cascade",
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
    is_received: {
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
  await queryInterface.dropTable('call_participants');
}
