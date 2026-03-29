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

test('GET /prices returns prices keyed by TLD', async () => {
    mockServer.setResponse('PE_GetRetailPricing', fixtures.getRetailPricing);

    const response = await app.inject({ method: 'GET', url: '/prices' });

    assert.equal(response.statusCode, 200);
    const { prices } = JSON.parse(response.body);

    assert.ok(prices['com'], '.com should be present');
    assert.equal(prices['com'].tld, 'com');
    assert.equal(prices['com'].registrationPrice, '10.99');
    assert.equal(prices['com'].renewalPrice, '12.99');
    assert.equal(prices['com'].transferPrice, '9.99');
});

test('GET /prices returns 403 on bad credentials', async () => {
    mockServer.setResponse('PE_GetRetailPricing', fixtures.errorBadCredentials);

    const response = await app.inject({ method: 'GET', url: '/prices' });

    assert.equal(response.statusCode, 403);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'Bad User name or Password');
});
