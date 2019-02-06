const StandardBounties = artifacts.require("../contracts/StandardBounties");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");

const utils = require('./helpers/Utils');

const BN = require('bignumber.js');

contract('StandardBounties', function(accounts) {


  it("[ETH] Verifies that the StandardBounties registry works", async () => {

    let registry = await StandardBounties.new();

  });

  it("[ETH] Verifies that I can issue a bounty paying in ETH without locking up funds", async () => {

    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, 0x0, 0, 0);

    let total = await registry.getNumBounties();

    assert(parseInt(total, 10) == 1, parseInt(total, 10));

  });

});
