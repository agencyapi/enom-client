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

test('GET /domains returns domain list keyed by name', async () => {
    mockServer.setResponse('GetAllDomains', fixtures.getAllDomains);

    const response = await app.inject({ method: 'GET', url: '/domains' });

    assert.equal(response.statusCode, 200);
    const { domains } = JSON.parse(response.body);

    assert.ok(domains['example.com'], 'example.com should be present');
    assert.equal(domains['example.com'].name, 'example.com');
    assert.equal(domains['example.com'].enomId, '123456');
    assert.equal(domains['example.com'].lockStatus, 'Locked');
    assert.equal(domains['example.com'].autoRenew, 'Yes');
    assert.ok(domains['example.com'].expiryDate, 'expiryDate should be present');

    assert.ok(domains['test.org'], 'test.org should be present');
    assert.equal(domains['test.org'].lockStatus, 'Unlocked');
    assert.equal(domains['test.org'].autoRenew, 'No');
});

test('GET /domains returns 403 on bad credentials', async () => {
    mockServer.setResponse('GetAllDomains', fixtures.errorBadCredentials);

    const response = await app.inject({ method: 'GET', url: '/domains' });

    assert.equal(response.statusCode, 403);
    const body = JSON.parse(response.body);
    assert.equal(body.error, 'Bad User name or Password');
});

test('GET /domains returns 403 on IP restriction', async () => {
    mockServer.setResponse('GetAllDomains', fixtures.errorIpRestricted);

    const response = await app.inject({ method: 'GET', url: '/domains' });

    assert.equal(response.statusCode, 403);
    const body = JSON.parse(response.body);
    assert.match(body.error, /User not permitted from this IP address/);
});
