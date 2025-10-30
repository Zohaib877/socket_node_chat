export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('conversations', {
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
    conversation_type: {
      type: Sequelize.ENUM(['private', 'group']),
      defaultValue: 'private'
    },
    title: {
      type: Sequelize.STRING,
      defaultValue: 1
    },
    description: {
      type: Sequelize.STRING,
      defaultValue: 1
    },
    image: {
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
  await queryInterface.dropTable('conversations');
}
