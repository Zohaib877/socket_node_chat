import fs from 'fs';
import https from 'https';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.resolve();
console.log("PATH==>", __dirname)
const mainDirectory = path.resolve(__dirname, '../../');
const sslDirectory = path.join(mainDirectory, 'ssl');
const app_env = process.env.APP_ENV || 'local';

dotenv.config();
var PORT = process.env.PORT || 5000;
var CERT_KEY = process.env.CERT_KEY || '';
var CERT_CRT = process.env.CERT_CRT || '';
var CERT_CA = process.env.CERT_CA || '';

export default function connection(app) {
    let expressServer;
    switch (app_env) {
        case 'local':
            expressServer = app.listen(PORT, () => {
                console.log(`\x1b[92mServer is now up and running on:\x1b[0m`);
                console.log(`\x1b[46mhttp://localhost:${PORT}\x1b[0m`);
            });
            break;
        case 'production':
            const server = https.createServer({
                key: fs.readFileSync(`${sslDirectory}/keys/${CERT_KEY}`),
                cert: fs.readFileSync(`./fullchain.pem`),
                //cert: fs.readFileSync(`${sslDirectory}/certs/${CERT_CRT}`),
            }, app);

            expressServer = server.listen(PORT, () => {
                console.log(`\x1b[92mServer is now up and running on:\x1b[0m`);
                console.log(`\x1b[46mhttps://demo-devwork.com:${PORT}\x1b[0m`);
            });
            break;

        default:
            break;
    }

    return expressServer;
}