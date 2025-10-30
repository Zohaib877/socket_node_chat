import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import connection from './config/db.js';

const umzug = new Umzug({
  migrations: {
    glob: 'database/migrations/*.js',
    resolve: ({ name, path, context }) => {
      const getModule = () => import(path);
      return {
        name,
        up: async (upParams) => (await getModule()).up(context.getQueryInterface(), context.Sequelize),
        down: async (downParams) => (await getModule()).down(context.getQueryInterface(), context.Sequelize),
      };
    },
  },
  context: connection,
  storage: new SequelizeStorage({ sequelize: connection }),
  logger: console,
});

await umzug.runAsCLI();
