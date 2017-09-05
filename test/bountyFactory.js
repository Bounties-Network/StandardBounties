const BountyRegistry = artifacts.require("../contracts/BountyRegistry.sol");
const StandardBountyFactory = artifacts.require("../contracts/StandardBountyFactory.sol")
const TokenBountyFactory = artifacts.require("../contracts/TokenBountyFactory.sol")
const StandardBounty = artifacts.require("../contracts/StandardBounty.sol");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken.sol");

const utils = require('./helpers/Utils');
const BN = require(`bn.js`);


contract('BountyFactory', function(accounts) {


  it("verifies that the owner is instantiated correctly", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

  });

  it("verifies that ownership can be transferred properly", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

    await manager.transferOwner(accounts[1], {from: accounts[0]});

    owner = await manager.owner();
    assert (owner == accounts[1]);

  });
  it("verifies that only the owner can transfer ownership ", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

    try {
      await manager.transferOwner(accounts[1], {from: accounts[1]});
    } catch(error){
      return utils.ensureException(error);
    }
  });

  it("verifies that bounty creation works", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

    let bounty = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[0]});

    let bounty0 = await manager.instances(0);
    assert (bounty.logs[0].args.instantiation == bounty0);
  });

  it("verifies that bounty creation works for token bounties too", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

    let bounty = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[0]});

    let bounty0 = await manager.instances(0);
    assert (bounty.logs[0].args.instantiation == bounty0);

    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    bounty = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0, bountyToken.address, {from: accounts[0]});
    bounty0 = await manager.instances(1);

    assert (bounty.logs[0].args.instantiation == bounty0);


  });
  it("verifies that bounty creation with incorrect args fails", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);


    try {
      await manager.create(2528821098,"",[0,1000,1000],3000,0x0,0x0, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });

  it("verifies that bounty removal works", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

    let bounty = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[1]});
    let bounty2 = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[1]});


    let bounty0 = await manager.instances(0);
    assert (bounty.logs[0].args.instantiation == bounty0);

    await manager.remove(0, bounty0, 0, accounts[1]);
    let instance = await manager.instances(0);
    assert(instance == "0x0000000000000000000000000000000000000000");
    let instantiation = await manager.instantiations(accounts[1], 0);
    assert(instantiation == "0x0000000000000000000000000000000000000000");

  });
  it("verifies that bounty removal fails for anyone but the owner", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

    let bounty = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[1]});
    let bounty2 = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[1]});


    let bounty0 = await manager.instances(0);
    assert (bounty.logs[0].args.instantiation == bounty0);

    try {
      await manager.remove(0, bounty0, 0, accounts[1], {from: accounts[1]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("verifies that bounty removal with wrong IDs fails", async () => {

    let stbf = await StandardBountyFactory.new({from: accounts[0]});
    let tbf = await TokenBountyFactory.new({from: accounts[0]});

    let manager = await BountyRegistry.new(stbf.address, tbf.address, {from: accounts[0]});

    let owner = await manager.owner();
    assert (owner == accounts[0]);

    let bounty = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[1]});
    let bounty2 = await manager.create(2528821098,"",[1000,1000,1000],3000,0x0,0x0, {from: accounts[1]});


    let bounty0 = await manager.instances(0);
    assert (bounty.logs[0].args.instantiation == bounty0);

    try {
      await manager.remove(1, bounty0, 1, accounts[1], {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });






});
