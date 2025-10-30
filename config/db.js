import dotenv from 'dotenv';
import connect from './../database/mysql.js';
// import postgres from './databases/postgres';
// import mongodb from './databases/mongodb';

dotenv.config();
const app_env = process.env.APP_ENV || 'local';
const db_env = process.env.DB_ENV || 'mysql';

let mysqlConfig, postgresConfig, mongodbConfig, connection;
switch (app_env) {
    case 'local':
      mysqlConfig = {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        DB_HOST: process.env.DB_HOST,
      };
      postgresConfig = {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        DB_HOST: process.env.DB_HOST,
      };
      mongodbConfig = {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        DB_HOST: process.env.DB_HOST,
      };
      break;
    case 'production':
      mysqlConfig = {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        DB_HOST: process.env.DB_HOST,
      };
      postgresConfig = {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        DB_HOST: process.env.DB_HOST,
      };
      mongodbConfig = {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        DB_HOST: process.env.DB_HOST,
      };
      break;
    default:
      throw new Error(`Unknown environment: ${env}`);
}

// Initialize database connections
switch (db_env) {
  case 'mysql':
    connection = connect(mysqlConfig);
    break;
  case 'postgres':
    connection = connect(postgresConfig);
    break;
  case 'mongodb':
    connection = connect(mongodbConfig);
    break;

  default:
    connection = '';
    break;
}

export default connection;
