export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('activities', {
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
    user_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    object_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    object_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    actor_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    is_viewed: {
      type: Sequelize.TINYINT(1),
      allowNull: true,
      default: 0
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
  await queryInterface.dropTable('activities');
}
