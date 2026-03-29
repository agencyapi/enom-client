'use strict'

const fs = require('node:fs');
const path = require('node:path');

const getAllDomains = `<?xml version="1.0"?>
<interface-response>
  <ErrCount>0</ErrCount>
  <GetAllDomains>
    <DomainDetail>
      <DomainName>example.com</DomainName>
      <DomainNameID>123456</DomainNameID>
      <expiration-date>12/31/2026 11:59:59 PM</expiration-date>
      <lockstatus>Locked</lockstatus>
      <AutoRenew>Yes</AutoRenew>
    </DomainDetail>
    <DomainDetail>
      <DomainName>test.org</DomainName>
      <DomainNameID>789012</DomainNameID>
      <expiration-date>6/15/2027 11:59:59 PM</expiration-date>
      <lockstatus>Unlocked</lockstatus>
      <AutoRenew>No</AutoRenew>
    </DomainDetail>
  </GetAllDomains>
</interface-response>`;

const getBalance = `<?xml version="1.0"?>
<interface-response>
  <ErrCount>0</ErrCount>
  <Balance>100.50</Balance>
  <AvailableBalance>95.25</AvailableBalance>
</interface-response>`;

const getRetailPricing = fs.readFileSync(path.join(__dirname, '../prices.xml'), 'utf8');

const errorBadCredentials = `<?xml version="1.0"?>
<interface-response>
  <ErrCount>1</ErrCount>
  <errors>
    <Err1>Bad User name or Password</Err1>
  </errors>
</interface-response>`;

const errorIpRestricted = `<?xml version="1.0"?>
<interface-response>
  <ErrCount>1</ErrCount>
  <errors>
    <Err1>User not permitted from this IP address: 1.2.3.4</Err1>
  </errors>
</interface-response>`;

module.exports = {
    getAllDomains,
    getBalance,
    getRetailPricing,
    errorBadCredentials,
    errorIpRestricted
};
