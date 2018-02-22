const StandardBounties = artifacts.require("../contracts/StandardBounties");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");

const utils = require('./helpers/Utils');


contract('StandardBounties', function(accounts) {

  it("[TOKENS] Verifies that the StandardBounties registry works", async () => {

    let registry = await StandardBounties.new(accounts[0]);

    let owner = await registry.owner();

    assert(owner == accounts[0])

  });

  it("[TOKENS] Verifies that I can issue a new bounty paying in Tokens", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,{from: accounts[0]});

  });

  it("[TOKENS] verifies that a date before the present will cause a failing construction", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    try {

      await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                  0,
                                  "data",
                                  1000,
                                  0x0,
                                  true,
                                  bountyToken.address,{from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });

  it("[TOKENS] verifies that a payout of 0 will fail", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    try {

      await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                  2528821098,
                                  "data",
                                  0,
                                  0x0,
                                  true,
                                  bountyToken.address,{from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });

  it("[TOKENS] verifies that simple bounty contribution and activation functions", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.contribute(0,1000, {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[4] == 0);
    await registry.activateBounty(0,0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[TOKENS] verifies that simple bounty activation functions", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[TOKENS] verifies that simple bounty activation functions for more than payout amount", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 5000, {from: accounts[0]});
    await registry.activateBounty(0,5000, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[TOKENS] verifies that simple bounty activation with too small a value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 500, {from: accounts[0]});
    try {
      await registry.activateBounty(0,500, {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that simple bounty activation with wrong value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 500, {from: accounts[0]});
    try {
      await registry.activateBounty(0,1000, {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that bounty issuance and activation all in one functions", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.issueAndActivateBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                1000,
                                {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[TOKENS] verifies that bounty issuance and activation all in one functions for more than payout amount", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    await bountyToken.approve(registry.address, 5000, {from: accounts[0]});
    await registry.issueAndActivateBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                5000,
                                {from: accounts[0],});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[TOKENS] verifies that bounty issuance and activation with incorrect value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    await bountyToken.approve(registry.address, 500, {from: accounts[0]});
    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  2528821098,
                                  "data",
                                  1000,
                                  0x0,
                                  true,
                                  bountyToken.address,
                                  1000,
                                  {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that bounty issuance and activation with too small a value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    await bountyToken.approve(registry.address, 500, {from: accounts[0]});

    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  2528821098,
                                  "data",
                                  1000,
                                  0x0,
                                  true,
                                  bountyToken.address,
                                  500,
                                  {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that bounty issuance and activation with date before today fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});

    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  0,
                                  "data",
                                  1000,
                                  0x0,
                                  true,
                                  bountyToken.address,
                                  1000,
                                  {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that bounty issuance and activation with payout of 0 fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});

    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  2528821098,
                                  "data",
                                  0,
                                  0x0,
                                  true,
                                  bountyToken.address,
                                  1000,
                                  {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");
  });
  it("[TOKENS] verifies that simple bounty contribution with incorrect value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");


    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 500, {from: accounts[0]});
    try {
      await registry.contribute(0,1000, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");
  });

  it("[TOKENS] verifies that simple bounty contribution with a value of 0 fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 0, {from: accounts[0]});
    try {
      await registry.contribute(0,0, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that simple bounty contribution sending ETH to a token bounty fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    try {
      await registry.contribute(0,1000, {from: accounts[0], value: 1000});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");
  });
  it("[TOKENS] verifies that simple bounty activation sending ETH to a token bounty fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    try {
      await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that activation before the bounty has sufficient funds fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 500, {from: accounts[0]});
    await registry.contribute(0,500, {from: accounts[0]});
    try {
      await registry.activateBounty(0,0, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that activation from non-issuer fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.contribute(0,1000, {from: accounts[0]});
    try {
      await registry.activateBounty(0,0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that contribution fails for dead bounties", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await registry.killBounty(0);
    await bountyToken.approve(registry.address, 500, {from: accounts[0]});
    try {
      await registry.contribute(0,500, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that basic fulfillment acceptance flow works", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    let fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] === false);
    await registry.acceptFulfillment(0,0,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] === true);
  });
  it("[TOKENS] verifies that changing a fulfillment works", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    let fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[2] === "data");
    await registry.updateFulfillment(0,0,"data2", {from: accounts[1]});
    fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[2] === "data2");
  });

  it("[TOKENS] verifies that changing an accepted fulfillment fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    let fulfillment = await registry.getFulfillment(0,0);
    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    try {
      await registry.updateFulfillment(0,0,"data2", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });

  it("[TOKENS] verifies that changing someone else's fulfillment fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data", {from: accounts[2]});

    try {
      await registry.updateFulfillment(0,0,"data2", {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that bounty fulfillment flow works to completion", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    let fulfillment = await registry.getFulfillment(0,0);

    await registry.acceptFulfillment(0,0,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);
    var bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);
  });
  it("[TOKENS] verifies that bounty fulfillment flow works to completion with several fulfillments", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    let fulfillment = await registry.getFulfillment(0,0);

    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);
    var bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);
  });
  it("[TOKENS] verifies that arbiter can't fulfill a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 2000, {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0]});
    try {
      await registry.fulfillBounty(0, "data", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that issuer can't fulfill a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 2000, {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0]});
    try {
      await registry.fulfillBounty(0, "data", {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that accepting too many fulfillments isn't allowed", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});
    let bounty = await registry.getBounty(0);
    let balance = await bountyToken.balanceOf(registry.address);
    assert(bounty[5]== 1000);
    assert(balance == 1000);
    await registry.acceptFulfillment(0,2,{from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await bountyToken.balanceOf(registry.address);
    assert(bounty[5]== 0);
    assert(balance == 0);
    try {
      await registry.acceptFulfillment(0,2,{from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that accepting an already accepted fulfillment fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data", {from: accounts[2]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] == true);

    try {
      await registry.acceptFulfillment(0,0,{from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that issuer can transfer ownership of a draft bounty to a new account", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await registry.transferIssuer(0, accounts[1], {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[0] == accounts[1]);

  });
  it("[TOKENS] verifies that issuer can transfer ownership of an active bounty to a new account", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000,  {from: accounts[0]});
    await registry.transferIssuer(0, accounts[1], {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[0] == accounts[1]);
  });
  it("[TOKENS] verifies that issuer can extend the deadline of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    await registry.extendDeadline(0, 2528821099, {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[1] == 2528821099);
  });

  it("[TOKENS] verifies that issuer can extend the deadline of an active bounty into an earlier date", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    try {
      await registry.extendDeadline(0, 2528821097, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });

  it("[TOKENS] verifies that issuer can extend the deadline of an active bounty into a much earlier date", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    try {
      await registry.extendDeadline(0, 2028821097, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that I can change the deadline of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await registry.changeBountyDeadline(0, 2028821098, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[1] == 2028821098);

  });
  it("[TOKENS] verifies that I can change the data of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await registry.changeBountyData(0, "newData", {from: accounts[0]});

    let bounty = await registry.getBountyData(0);
    assert(bounty == "newData");

  });
  it("[TOKENS] verifies that I can decrease the fulfillment amount of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await registry.changeBountyFulfillmentAmount(0, 500, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 500);
  });
  it("[TOKENS] verifies that I can increase the fulfillment amount of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await registry.changeBountyFulfillmentAmount(0, 2000, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
  });

  it("[TOKENS] verifies that I can change the arbiter of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    let arbiter = await registry.getBountyArbiter(0);
    assert(arbiter == accounts[1]);
    await registry.changeBountyArbiter(0, accounts[2], {from: accounts[0]});

    arbiter = await registry.getBountyArbiter(0);
    assert(arbiter == accounts[2]);

  });
  it("[TOKENS] verifies that I can't change the deadline of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});

    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    try {
      await registry.changeBountyDeadline(0, 2028821098, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");


  });
  it("[TOKENS] verifies that I can't change the data of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    try {
      await registry.changeBountyData(0, "newData", {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that I can't decrease the fulfillment amount of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    try {
      await registry.changeBountyFulfillmentAmount(0, 500, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that I can't increase the fulfillment amount of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});

    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    try {
      await registry.changeBountyFulfillmentAmount(0, 2000, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });

  it("[TOKENS] verifies that I can't change the arbiter of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                true,
                                bountyToken.address,
                                {from: accounts[0]});

    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});
    try {
      await registry.changeBountyArbiter(0, accounts[2], {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });

  it("[TOKENS] verifies that issuer must redeposit funds after killing a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 2000, {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);

    try {
      await registry.activateBounty(0, 0, {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });

  it("[TOKENS] verifies that issuer must redeposit sufficient funds to pay a fulfillment after killing a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 2000, {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);

    await bountyToken.approve(registry.address, 500, {from: accounts[0]});
    try {
      await registry.activateBounty(0, 500, {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });
  it("[TOKENS] verifies that reactivating a bounty works when the sufficient amount is deposited", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 2000, {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[4] == 2);

    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);

  });

  it("[TOKENS] verifies that increasing a payout amount for an unaccepted fulfillment works", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 2000, {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 2000);

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 2000);

    await registry.increasePayout(0,2000, 0, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 2000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);


  });
  it("[TOKENS] verifies that increasing a payout amount with value works", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 1000);

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 1000);

    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});
    await registry.increasePayout(0,2000, 1000, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 2000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);
  });
  it("[TOKENS] verifies that increasing a payout amount for an accepted fulfillment works", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 3000, {from: accounts[0]});
    await registry.activateBounty(0,3000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 3000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 2000);

    await registry.increasePayout(0, 2000, 0, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 2000);

  });

  it("[TOKENS] verifies that increasing a payout amount with too small of a balance fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 3000, {from: accounts[0]});
    await registry.activateBounty(0,3000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    await registry.acceptFulfillment(0,1, {from: accounts[0]});

    try {
      await registry.increasePayout(0,2000, 0, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");



  });
  it("[TOKENS] verifies that increasing the payout with a lower amount fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,
                                {from: accounts[0]});
    await bountyToken.approve(registry.address, 3000, {from: accounts[0]});
    await registry.activateBounty(0,3000, {from: accounts[0]});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    try {
      await registry.increasePayout(0,900, 0, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
    assert(false, "did not error as was expected");

  });





});
