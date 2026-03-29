'use strict'

const { createMockServer } = require('./helpers/mock-enom-server');
const fixtures = require('./helpers/fixtures');

let mockServer;
let app;

beforeAll(async () => {
    process.env.ENOM_USER = 'testuser';
    process.env.ENOM_KEY = 'testkey';

    mockServer = await createMockServer();
    process.env.ENOM_BASE_URL = mockServer.url;

    app = require('../server');
    await app.ready();
});

afterAll(async () => {
    await app.close();
    await mockServer.close();
    delete process.env.ENOM_BASE_URL;
});

test('GET /domains returns domain list keyed by name', async () => {
    mockServer.setResponse('GetAllDomains', fixtures.getAllDomains);

    const response = await app.inject({ method: 'GET', url: '/domains' });

    expect(response.statusCode).toBe(200);
    const { domains } = JSON.parse(response.body);

    expect(domains['example.com']).toBeDefined();
    expect(domains['example.com'].name).toBe('example.com');
    expect(domains['example.com'].enomId).toBe('123456');
    expect(domains['example.com'].lockStatus).toBe('Locked');
    expect(domains['example.com'].autoRenew).toBe('Yes');
    expect(domains['example.com'].expiryDate).toBeDefined();

    expect(domains['test.org']).toBeDefined();
    expect(domains['test.org'].lockStatus).toBe('Unlocked');
    expect(domains['test.org'].autoRenew).toBe('No');
});

test('GET /domains returns 403 on bad credentials', async () => {
    mockServer.setResponse('GetAllDomains', fixtures.errorBadCredentials);

    const response = await app.inject({ method: 'GET', url: '/domains' });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad User name or Password');
});

test('GET /domains returns 403 on IP restriction', async () => {
    mockServer.setResponse('GetAllDomains', fixtures.errorIpRestricted);

    const response = await app.inject({ method: 'GET', url: '/domains' });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toMatch(/User not permitted from this IP address/);
});
