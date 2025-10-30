export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('messages', {
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
    conversation_id: {
      type: Sequelize.DataTypes.INTEGER,
      references: {
        model: "conversations",
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "cascade",
    },
    is_event: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    media_type: {
      type: Sequelize.ENUM(["image", "video", "voice", "docs"]),
      allowNull: true,
    },
    media: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    object_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    object_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.TINYINT(1),
      allowNull: true,
    },
    view_for: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleted_for: {
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
  await queryInterface.dropTable('messages');
}
