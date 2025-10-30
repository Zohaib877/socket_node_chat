export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('transcriptions', {
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
    call_id: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'calls',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    duration: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    language: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true,
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
  await queryInterface.dropTable('transcriptions');
}
