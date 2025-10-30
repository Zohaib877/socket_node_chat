import Sequelize from 'sequelize';

const connect = (config) => {
    const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASS, {
        host: config.DB_HOST,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 600000000,
            idle: 10000
        }
    });

    sequelize.sync({ force: false })
        .then(() => {
            console.log('\x1b[33mDatabase and tables synced!\x1b[0m');
        })
        .catch((err) => {
            console.error('Database synchronization error:', err);
        });

    return sequelize;
};

export default connect;
