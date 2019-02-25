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

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 0);

    let total = await registry.numBounties();

    assert(parseInt(total, 10) == 1, parseInt(total, 10));

  });

  it("[ETH] Verifies that I can issue a bounty paying in ETH while locking up funds", async () => {

    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    let total = await registry.numBounties();

    assert(parseInt(total, 10) == 1, parseInt(total, 10));

    let bounty = await registry.bounties(0);

    assert(parseInt(bounty.balance, 10) == 1);

  });

  it("[ETH] Verifies that I can't issue a bounty with the issuer as 0x0", async () => {
    let registry = await StandardBounties.new();

    try {
      await registry.issueBounty("0x0000000000000000000000000000000000000000", [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");

  });

  it("[ETH] Verifies that I can't issue a bounty contributing more than the deposit amount", async () => {
    let registry = await StandardBounties.new();

    try {
      await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 10});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");

  });

  it("[ETH] Verifies that I can't issue a bounty contributing less than the deposit amount", async () => {
    let registry = await StandardBounties.new();

    try {
      await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 1});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can contribute to a bounty in ETH", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.contribute(0, 1, {value: 1});

    let bounty = await registry.bounties(0);

    assert(parseInt(bounty.balance, 10) == 2);

  });

  it("[ETH] Verifies that I can't contribute to a bounty which is out of bounds", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    try {
      await registry.contribute(1, 1, {value: 1});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't contribute to a bounty which has already paid out", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});
    await registry.fulfillAndAccept(0, [accounts[1]], "data", 0, [1]);

    try {
      await registry.contribute(0, 1, {value: 1});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't contribute to a bounty and send less than the deposit amount", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    try {
      await registry.contribute(0, 10, {value: 1});

    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that contributing emits an event", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.contribute(0, 1, {value: 1}).then((status) => {
      assert.strictEqual('ContributionAdded', status.logs[0].event, 'did not emit the ContributionAdded event');
    });

  });

  it("[ETH] Verifies that I can refund a contribution in ETH", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.contribute(0, 1, {value: 1});

    let bounty = await registry.bounties(0);

    assert(parseInt(bounty.balance, 10) == 2);

    var block = await web3.eth.getBlock('latest');

    await registry.changeDeadline(0, parseInt(block.timestamp, 10) - 10);

    await registry.refundContribution(0,0);

    bounty = await registry.bounties(0);

    assert(parseInt(bounty.balance, 10) == 1);
  });

  it("[ETH] Verifies that I can't refund a contribution to a bounty which has paid out", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});
    await registry.contribute(0, 1, {value: 1});
    await registry.fulfillAndAccept(0, [accounts[6]], "data", 0, [1]);

    try {
      await registry.refundContribution(0,0);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't refund a contribution to a bounty which is out of bounds", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});
    await registry.contribute(0, 1, {value: 1});

    try {
      await registry.refundContribution(1,0);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");

  });

  it("[ETH] Verifies that I can't refund a contribution which is out of bounds", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});
    await registry.contribute(0, 1, {value: 1});

    try {
      await registry.refundContribution(0,1);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't refund a contribution which isn't mine", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});
    await registry.contribute(0, 1, {from: accounts[0], value: 1});
    await registry.contribute(0, 1, {from: accounts[1], value: 1});


    try {
      await registry.refundContribution(0,0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't refund a contribution which has already been refunded", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});
    await registry.contribute(0, 1, {value: 1});

    var block = await web3.eth.getBlock('latest');

    await registry.changeDeadline(0, parseInt(block.timestamp, 10) - 10);

    await registry.refundContribution(0,0);

    try {
      await registry.refundContribution(0,0);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't refund a contribution before the deadline has elapsed", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});
    await registry.contribute(0, 1, {value: 1});

    try {
      await registry.refundContribution(0,0);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that refunding a contribution emits an event", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.contribute(0, 1, {value: 1});

    let bounty = await registry.bounties(0);

    assert(parseInt(bounty.balance, 10) == 2);

    var block = await web3.eth.getBlock('latest');

    await registry.changeDeadline(0, parseInt(block.timestamp, 10) - 10);

    await registry.refundContribution(0,0).then((status) => {
      assert.strictEqual('ContributionRefunded', status.logs[0].event, 'did not emit the ContributionRefunded event');
    });
  });

  it("[ETH] Verifies that I can perform an action for a bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.performAction(0, "actionData");

  });

  it("[ETH] Verifies that I can't perform an action for an out of bounds bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    try {
      await registry.performAction(1, "actionData");
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that performing an action emits an event", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.performAction(0, "actionData").then((status) => {
      assert.strictEqual('ActionPerformed', status.logs[0].event, 'did not emit the ActionPerformed event');
    });
  });

  it("[ETH] Verifies that I can fulfill a bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    let fulfillments = await registry.getBountyFulfillments(0);
    assert(fulfillments.length == 1);
    assert(fulfillments[0].fulfillers[0] == accounts[1]);
    assert(fulfillments[0].fulfillers[1] == accounts[2]);
    assert(fulfillments[0].submitter == accounts[0]);

  });

  it("[ETH] Verifies that I can't fulfill an out of bounds bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    try {
      await registry.fulfillBounty(1, [accounts[1], accounts[2]], "data");
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");

  });

  it("[ETH] Verifies that I can't fulfill a bounty after the deadline has elapsed", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 1, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    try {
      await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't fulfill a bounty with 0 fulfillers", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    try {
      await registry.fulfillBounty(0, [], "data");
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that fulfilling a bounty emits an event", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data").then((status) => {
      assert.strictEqual('BountyFulfilled', status.logs[0].event, 'did not emit the BountyFulfilled event');
    });

  });

  it("[ETH] Verifies that I can update a fulfillment", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    await registry.updateFulfillment(0, 0, [accounts[3], accounts[4]], "data2");

    let fulfillments = await registry.getBountyFulfillments(0);

    assert(fulfillments.length == 1);
    assert(fulfillments[0].fulfillers[0] == accounts[3]);
    assert(fulfillments[0].fulfillers[1] == accounts[4]);
    assert(fulfillments[0].submitter == accounts[0]);


  });

  it("[ETH] Verifies that I can't update a fulfillment for an out of bounds bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.updateFulfillment(1, 0, [accounts[3], accounts[4]], "data2");
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't update an out of bounds fulfillment", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.updateFulfillment(0, 1, [accounts[3], accounts[4]], "data2");
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't update a fulfillment which was submitted by someone else", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.updateFulfillment(0, 0, [accounts[3], accounts[4]], "data2", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that updating a fulfillment emits an event", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    await registry.updateFulfillment(0, 0, [accounts[3], accounts[4]], "data2").then((status) => {
      assert.strictEqual('FulfillmentUpdated', status.logs[0].event, 'did not emit the FulfillmentUpdated event');
    });

  });

  it("[ETH] Verifies that I can accept a fulfillment as an issuer", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    var balanceBefore = await web3.eth.getBalance(accounts[1]);
    var balanceBefore2 = await web3.eth.getBalance(accounts[2]);

    await registry.acceptFulfillment(0,0,0,[5,5])

    var balanceAfter = await web3.eth.getBalance(accounts[1]);
    var balanceAfter2 = await web3.eth.getBalance(accounts[2]);

    assert(parseInt(balanceBefore, 10) == (parseInt(balanceAfter, 10)+5));
    assert(parseInt(balanceBefore2, 10) == (parseInt(balanceAfter2, 10)+5));

  });

  it("[ETH] Verifies that I can accept a fulfillment paying different amounts to different fulfillers", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    var balanceBefore = await web3.eth.getBalance(accounts[1]);
    var balanceBefore2 = await web3.eth.getBalance(accounts[2]);

    await registry.acceptFulfillment(0,0,0,[2,8]);

    var balanceAfter = await web3.eth.getBalance(accounts[1]);
    var balanceAfter2 = await web3.eth.getBalance(accounts[2]);

    assert(parseInt(balanceBefore, 10) == (parseInt(balanceAfter, 10) + 2));
    assert(parseInt(balanceBefore2, 10) == (parseInt(balanceAfter2, 10) + 8));
  });

  it("[ETH] Verifies that I can accept a fulfillment as an approver", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    var balanceBefore = await web3.eth.getBalance(accounts[1]);
    var balanceBefore2 = await web3.eth.getBalance(accounts[2]);

    await registry.acceptFulfillment(0,0,0,[2,8], {from: accounts[1]});

    var balanceAfter = await web3.eth.getBalance(accounts[1]);
    var balanceAfter2 = await web3.eth.getBalance(accounts[2]);

    assert(parseInt(balanceBefore, 10) == (parseInt(balanceAfter, 10) + 2));
    assert(parseInt(balanceBefore2, 10) == (parseInt(balanceAfter2, 10) + 8), "failed"+(parseInt(balanceAfter2, 10) + 8)+", "+parseInt(balanceBefore2, 10));

  });

  it("[ETH] Verifies that I can't accept a fulfillment on an out of bounds bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.acceptFulfillment(1,0,0,[2,8], {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't accept a fulfillment which is out of bounds", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.acceptFulfillment(0,1,0,[2,8], {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't accept a fulfillment if I'm not an approver", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.acceptFulfillment(0,0,0,[2,8], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't accept a fulfillment by passing in the wrong number of token amounts corresponding to the number of fulfillers", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.acceptFulfillment(0,0,0,[2], {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't accept a fulfillment paying out more than the balance of my bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    try {
      await registry.acceptFulfillment(0,0,0,[2,18], {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that accepting a fulfillment emits an event", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.fulfillBounty(0, [accounts[1], accounts[2]], "data");

    await registry.acceptFulfillment(0,0,0,[2,8], {from: accounts[1]}).then((status) => {
      assert.strictEqual('FulfillmentAccepted', status.logs[0].event, 'did not emit the FulfillmentAccepted event');
    });
  });

  it("[ETH] Verifies that I can fulfill and accept a bounty simultaneously", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    var balanceBefore = await web3.eth.getBalance(accounts[1]);
    var balanceBefore2 = await web3.eth.getBalance(accounts[2]);

    await registry.fulfillAndAccept(0, [accounts[1], accounts[2]], "data", 0, [2, 8]);

    var balanceAfter = await web3.eth.getBalance(accounts[1]);
    var balanceAfter2 = await web3.eth.getBalance(accounts[2]);

    assert(parseInt(balanceBefore, 10) == (parseInt(balanceAfter, 10) + 2));
    assert(parseInt(balanceBefore2, 10) == (parseInt(balanceAfter2, 10) + 8));

  });

  it("[ETH] Verifies that I can drain a bounty of a subset of the funds in the bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.drainBounty(0, 4);

    var bounty = await registry.bounties(0);

    assert(parseInt(bounty.balance, 10) === 6);
  });

  it("[ETH] Verifies that I can drain a bounty of all funds in the bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.drainBounty(0, 10);

    var bounty = await registry.bounties(0);

    assert(parseInt(bounty.balance, 10) === 0);

  });

  it("[ETH] Verifies that I can't drain a bounty which is out of bounds", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    try {
      await registry.drainBounty(1, 10);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't drain a bounty of which I am not the issuer", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    try {
      await registry.drainBounty(0, 10, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that I can't drain a bounty of more funds than the balance", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    try {
      await registry.drainBounty(0, 100);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");
  });

  it("[ETH] Verifies that draining a bounty emits an event", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.drainBounty(0, 10).then((status) => {
      assert.strictEqual('BountyDrained', status.logs[0].event, 'did not emit the BountyDrained event');
    });
  });

  it("[ETH] Verifies that I can change all of a bounty's info", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    await registry.changeBounty(0, accounts[5], [accounts[6], accounts[7]], "data2", 2528821200);

    var bounty = await registry.bounties(0);

    assert(bounty.issuer === accounts[5]);
    assert(bounty.approvers[0] === accounts[6]);
    assert(bounty.approvers[1] === accounts[7]);
    assert(bounty.deadline === 2528821200);

  });

  it("[ETH] Verifies that I can't change an out of bounds bounty", async () => {
    let registry = await StandardBounties.new();

    await registry.issueBounty(accounts[0], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 10, {value: 10});

    try {
      await registry.changeBounty(1, accounts[5], [accounts[6], accounts[7]], "data2", 2528821200);
    } catch (error){
      return utils.ensureException(error);
    }
    assert(false, "Should have thrown an error");

  });

  it("[ETH] Verifies that I can't change a bounty if I didn't issue it", async () => {

  });

  it("[ETH] Verifies that I can change the controller of my bounty", async () => {

  });

  it("[ETH] Verifies that I can't change the controller of an out of bounds bounty", async () => {

  });

  it("[ETH] Verifies that I can't the controller of a bounty if I didn't issue it", async () => {

  });

  it("[ETH] Verifies that I can change a bounty's approver", async () => {

  });

  it("[ETH] Verifies that I can't change an out of bounds bounty's approver", async () => {

  });

  it("[ETH] Verifies that I can't change a bounty's approver if I didn't issue it", async () => {

  });

  it("[ETH] Verifies that I can change a bounty's data", async () => {

  });

  it("[ETH] Verifies that I can't change an out of bounds bounty's data", async () => {

  });

  it("[ETH] Verifies that I can't change a bounty's data if I didn't issue it", async () => {

  });

  it("[ETH] Verifies that I can change a bounty's deadline", async () => {

  });

  it("[ETH] Verifies that I can't change an out of bounds bounty's deadline", async () => {

  });

  it("[ETH] Verifies that I can't change a bounty's deadline if I didn't issue it", async () => {

  });

  it("[ETH] Verifies that I can add approvers to a bounty", async () => {

  });

  it("[ETH] Verifies that I can't add approvers to an out of bounds bounty", async () => {

  });

  it("[ETH] Verifies that I can't add approvers to a bounty if I didn't issue it", async () => {

  });

});