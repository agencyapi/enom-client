'use strict'

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createMockServer } = require('./helpers/mock-enom-server');
const fixtures = require('./helpers/fixtures');

let mockServer;
let app;

before(async () => {
    process.env.ENOM_USER = 'testuser';
    process.env.ENOM_KEY = 'testkey';

    mockServer = await createMockServer();
    process.env.ENOM_BASE_URL = mockServer.url;

    app = require('../server');
    await app.ready();
});

after(async () => {
    await app.close();
    await mockServer.close();
    delete process.env.ENOM_BASE_URL;
});

test('GET /balance returns numeric balance fields', async () => {
    mockServer.setResponse('GetBalance', fixtures.getBalance);

    const response = await app.inject({ method: 'GET', url: '/balance' });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.equal(body.balance, 100.50);
    assert.equal(body.availableBalance, 95.25);
});

test('GET /balance returns 403 on bad credentials', async () => {
    mockServer.setResponse('GetBalance', fixtures.errorBadCredentials);

    const response = await app.inject({ method: 'GET', url: '/balance' });

    assert.equal(response.statusCode, 403);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'Bad User name or Password');
});
