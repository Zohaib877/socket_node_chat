import { Sequelize } from "sequelize";
import connection from "../../config/db.js";
import User from "./Users.js";

const Transcription = connection.define(
  "transcriptions",
  {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      references: {
        model: User,
        key: "id",
      },
      onUpdate: "cascade",
      onDelete: "cascade",
    },
    call_id: {
      type: Sequelize.BIGINT.UNSIGNED,
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
      type: Sequelize.STRING,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    underscored: true,
    timestamps: true,
    paranoid: true,
  }
);

export default Transcription;
