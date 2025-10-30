export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER, // Use the Sequelize passed to the function
    },
    full_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bio: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    profile_image: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    language: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    otp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    expired_at: {
      type: Sequelize.STRING,
      allowNull: false,
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
  await queryInterface.dropTable('users');
}
