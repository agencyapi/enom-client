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

test('GET /prices returns prices keyed by TLD', async () => {
    mockServer.setResponse('PE_GetRetailPricing', fixtures.getRetailPricing);

    const response = await app.inject({ method: 'GET', url: '/prices' });

    expect(response.statusCode).toBe(200);
    const { prices } = JSON.parse(response.body);

    expect(prices['com']).toBeDefined();
    expect(prices['com'].tld).toBe('com');
    expect(prices['com'].registrationPrice).toBe('10.99');
    expect(prices['com'].renewalPrice).toBe('12.99');
    expect(prices['com'].transferPrice).toBe('9.99');
});

test('GET /prices returns 403 on bad credentials', async () => {
    mockServer.setResponse('PE_GetRetailPricing', fixtures.errorBadCredentials);

    const response = await app.inject({ method: 'GET', url: '/prices' });

    expect(response.statusCode).toBe(403);
    expect(response.body).toBe('Forbidden');
});
