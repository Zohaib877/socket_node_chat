export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('participants', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT.UNSIGNED, // Match 'users.id' type
    },
    user_id: {
      type: Sequelize.DataTypes.INTEGER, // Match 'users.id' type
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    conversation_id: {
      type: Sequelize.DataTypes.INTEGER, // Match with conversations.id
      references: {
        model: 'conversations',
        key: 'id',
      },
      allowNull: false,
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    is_admin: {
      type: Sequelize.TINYINT(1),
      allowNull: true,
      defaultValue: 1,
    },
    status: {
      type: Sequelize.TINYINT(1),
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

export async function down(queryInterface) {
  await queryInterface.dropTable('participents');
}
