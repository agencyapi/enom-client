'use strict'

const { log } = require("./logger");
const server = require('fastify')({
    // disable embedded request logging, rely on a custom hook instead
    disableRequestLogging: true
});

// Require library to exit fastify process, gracefully
const closeWithGrace = require('close-with-grace');

const fastifyEnv = require('@fastify/env')

const schema = {
    type: 'object',
    required: ['ENOM_USER', 'ENOM_KEY'],
    properties: {
        ENOM_USER: { type: 'string' },
        ENOM_KEY: { type: 'string' },
        PORT: { type: 'integer', default: 4000 },
        HOST: { type: 'string', default: '127.0.0.1' }
    }
}

server.register(fastifyEnv, {
    confKey: 'config',
    schema: schema,
    dotenv: true
});

server.register(require('@fastify/middie'));

server.addHook('onRequest', async (request) => {
    log('info', 'request-incoming', {
        path: request.url,
        method: request.method,
        ip: request.ip,
        ua: request.headers['user-agent'] || null
    });
});

server.setErrorHandler(async (error, request) => {
    log('error', 'request-failure', {
        stack: error.stack,
        path: request.url,
        method: request.method,
    });
    return { error: error.message };
});

server.register(require('./domains.js'));
server.register(require('./healthcheck.js'));
server.register(require('./balance.js'));

// graceful shutdown
const closeListeners = closeWithGrace({ delay: 500 }, async function ({ err }) {
    if (err) {
        log("error", err);
    }
    await server.close();
});

server.addHook('onClose', async () => {
    closeListeners.uninstall();
});

// Run the server!
const start = async () => {
    try {
        await server.ready();

        const { PORT, HOST, ENOM_USER } = server.config;

        console.log(`Starting as pid=${process.pid}`);
        console.log(`Enom API user=${ENOM_USER}`);

        const address = await server.listen({
            port: PORT,
            host: HOST
        });

        // noinspection HttpUrlsUsage
        log("info", `Listening at ${address}`);
    } catch (err) {
        log("error", err);
        process.exit(1);
    }
};

void start();