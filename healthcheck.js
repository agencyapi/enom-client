'use strict'

const {createClient} = require("./enom");

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

let credentialCache = null;
let checkInFlight = null;

module.exports = async function (fastify) {
    fastify.get('/health', async (request, reply) => {
        const {ENOM_USER, ENOM_KEY} = fastify.config;

        if (!ENOM_USER || !ENOM_KEY) {
            return reply
                .code(500)
                .type('text/plain; charset=utf-8')
                .send("Service is not configured correctly")
        }

        if (credentialCache && (Date.now() - credentialCache.timestamp) < CACHE_TTL_MS) {
            if (credentialCache.valid) {
                return reply
                    .code(200)
                    .type('text/plain; charset=utf-8')
                    .send("OK")
            } else {
                const errorCode = credentialCache.error?.errorCode ?? 500;
                return reply
                    .code(errorCode)
                    .type('application/json; charset=utf-8')
                    .send(credentialCache.error)
            }
        }

        if (!checkInFlight) {
            checkInFlight = new Promise((resolve) => {
                const enomClient = createClient(ENOM_USER, ENOM_KEY);
                enomClient.checkLogin(function (error) {
                    credentialCache = {
                        valid: !error,
                        error: error || null,
                        timestamp: Date.now()
                    };
                    resolve(credentialCache);
                    checkInFlight = null;
                });
            });
        }

        const cache = await checkInFlight;

        if (cache.valid) {
            return reply
                .code(200)
                .type('text/plain; charset=utf-8')
                .send("OK")
        } else {
            const errorCode = cache.error?.errorCode ?? 500;
            return reply
                .code(errorCode)
                .type('application/json; charset=utf-8')
                .send(cache.error)
        }
    })
}