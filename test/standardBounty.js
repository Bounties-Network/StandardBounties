const StandardBounty = artifacts.require("../contracts/StandardBounty.sol");
const utils = require('./helpers/Utils');
const BN = require(`bn.js`);


contract('StandardBounty', function(accounts) {


  it("verifies that the issuer and state are correct after construction", async () => {

    let contract = await StandardBounty.new(accounts[0], 2528821098, "", [1000,1000,1000], 3000, 0x0);
    let issuer = await contract.issuer.call();
    let stage = await contract.bountyStage.call();


    assert.equal(issuer, accounts[0]);
    assert.equal(stage, 0);

  });

  it("verifies that a date before the present will cause a failing construction", async () => {
    try {
      await StandardBounty.new(accounts[0],
                                0,
                                "",
                                [1000,1000,1000],
                                3000,
                                0x0);
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("verifies that a milestone payout of 0 will fail", async () => {
    try {
      await StandardBounty.new(accounts[0],
                              2528821098,
                              "",
                              [0,1000,1000],
                              2000,
                              0x0);
      assert(false, "didn't throw");
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("verifies that the totalFulfillmentAmounts must equal the sum of the individual fulfillment payment amounts", async () => {
    try {
      await StandardBounty.new(accounts[0],
                              2528821098,
                              "",
                              [1000,1000,1000],
                              2000,
                              0x0);
      assert(false, "didn't throw");
    } catch (error){
      return utils.ensureException(error);
    }

  });


  it("verifies that simple bounty contribution and activation functions", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.contribute(3000, {from: accounts[0], value: 3000});
    await contract.activateBounty(0, {from: accounts[0]});
    let stage = await contract.bountyStage.call();
    assert(stage == 1);

  });
  it("verifies that simple bounty contribution with incorrect value fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    try {
      await contract.contribute(4000, {from: accounts[0], value: 3000});
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("verifies that simple bounty contribution with a value of 0 fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    try {
      await contract.contribute(0, {from: accounts[0], value: 0});
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("verifies that activation before the bounty has sufficient funds fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.contribute(2000, {from: accounts[0], value: 2000});
    let balance = await web3.eth.getBalance(contract.address);
    assert (balance == 2000);
    try {
      await contract.activateBounty(0, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("verifies that contribution fails for dead bounties", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.killBounty({from: accounts[0]});
    let stage = await contract.bountyStage.call();
    let balance = await web3.eth.getBalance(contract.address);
    assert (stage == 2);
    try {
      await contract.contribute(3000, {from: accounts[0], value: 3000});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("verifies that activation without contribution works", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
  });
  it("verifies that activation from non-issuer account fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    let issuer = await contract.issuer.call();
    assert(issuer == accounts[0]);
    let stage = await contract.bountyStage.call();
    assert (stage == 0);
    try {
      await contract.activateBounty(3000, {from: accounts[1], value: 3000});
    } catch (error){
      let stage = await contract.bountyStage.call();
      assert (stage == 0);
      return utils.ensureException(error);
    }
  });
  it("verifies that activation with too small a value fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    let stage = await contract.bountyStage.call();
    assert (stage == 0);
    try {
      await contract.activateBounty(2000, {from: accounts[0], value: 2000});
    } catch (error){
      let stage = await contract.bountyStage.call();
      assert (stage == 0);
      return utils.ensureException(error);
    }
  });
  it("verifies that activation with incorrect value fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    let stage = await contract.bountyStage.call();
    assert (stage == 0);
    try {
      await contract.activateBounty(4000, {from: accounts[0], value: 3000});
    } catch (error){
      let stage = await contract.bountyStage.call();
      assert (stage == 0);
      return utils.ensureException(error);
    }
  });
  it("verifies that basic fulfillment-acceptance flow works", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 2000);
  });
  it("verifies that changing a fulfillment works", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");

    await contract.updateFulfillment("newData",0,0,{from: accounts[1]});
    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[3] == "newData");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});
  });
  it("verifies that changing an accepted fulfillment fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    try {
      await contract.updateFulfillment("newData",0,0,{from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("verifies that changing someone else's fulfillment fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    try {
      await contract.updateFulfillment("newData",0,0,{from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("verifies that fulfillment-acceptance flow works to completion", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    /// first fulfillment

    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-1000);

    /// second fulfillment


    await contract.fulfillBounty("data",  1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(1,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(1,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-2000);

    /// third fulfillment

    await contract.fulfillBounty("data",  2, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(2,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(2,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(2,0, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(2);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(2,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(2,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 0);

  });

  it("verifies that basic fulfillment-acceptance from unique fulfillers works", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    /// first fulfillment

    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-1000);

    /// second fulfillment
    await contract.fulfillBounty("data",  1, {from: accounts[2]});
    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[2]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(1,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[2]).valueOf(), 10);
    await contract.fulfillmentPayment(1,0, {from: accounts[2]});

    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-2000);

    /// third fulfillment

    await contract.fulfillBounty("data",  2, {from: accounts[3]});
    fulfillment = await contract.getFulfillment(2,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[3]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(2,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(2,0, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(2);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[3]).valueOf(), 10);
    await contract.fulfillmentPayment(2,0, {from: accounts[3]});

    fulfillment = await contract.getFulfillment(2,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 0);

  });


  it("verifies that claiming payment twice fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 2000);
    try {
      await contract.fulfillmentPayment(0,0,{from: accounts[1]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that arbiter can't fulfill a bounty", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            accounts[1]);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    try {
      await contract.fulfillBounty("data",  0, {from: accounts[1]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that killing bounty leaves the correct remaining amount for payment", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    //first fulfillment
    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);
    // Second fulfillment
    await contract.fulfillBounty("data",  1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(1,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    // kill bounty

    await contract.killBounty({from: accounts[0]});
    stage = await contract.bountyStage.call();
    assert (stage == 2);
    let balance = await web3.eth.getBalance(contract.address);
    assert (balance == 2000);

    await contract.fulfillmentPayment(0,0, {from: accounts[1]});
    await contract.fulfillmentPayment(1,0, {from: accounts[1]});

    balance = await web3.eth.getBalance(contract.address);
    assert (balance == 0);

  });

  it("verifies that accepting too many bounties isn't allowed", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    //first fulfillment
    await contract.fulfillBounty("data",  0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);
    // Second fulfillment
    await contract.fulfillBounty("data",  1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(1,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(1,0, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    // Third fulfillment
    await contract.fulfillBounty("data",  1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(1,1, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(1,1, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(1,1, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 2);

    // Fourth fulfillment
    await contract.fulfillBounty("data",  1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(1,2, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");


    try {
      await contract.acceptFulfillment(2,1, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("verifies that claiming payment for someone else's bounty isn't allowed", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    //first fulfillment
    await contract.fulfillBounty("data",  0, {from: accounts[3]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[3]);
    assert(fulfillment[3] == "data");


    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);




    try {
      await contract.fulfillmentPayment(0,0, {from: accounts[1]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("verifies that issuer can transfer ownership to a new account", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    let stage = await contract.bountyStage.call();
    assert (stage == 1);

    await contract.transferIssuer(accounts[1], {from: accounts[0]});
    let issuer = await contract.issuer.call();
    assert (issuer == accounts[1]);
  });
  it("verifies that issuer can extend the deadline of the bounty", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    let stage = await contract.bountyStage.call();
    assert (stage == 1);

    await contract.extendDeadline(2628821098, {from: accounts[0]});
    let deadline = await contract.deadline.call();
    assert (deadline == 2628821098);

  });
  it("verifies that issuer can't extend the deadline to an earlier date", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    let stage = await contract.bountyStage.call();
    assert (stage == 1);

    try {
      await contract.extendDeadline(2428821098, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("verifies that issuer can't change the bounty when it isn't in the draft stage", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    let stage = await contract.bountyStage.call();
    assert (stage == 1);

    try {
      await contract.changeBounty(accounts[0], 2628821098, "data", [900, 900, 900], 2700, 0x0, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("verifies that claiming payment twice fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    await contract.fulfillBounty("data", 0, {from: accounts[3]});

    await contract.acceptFulfillment(0,0, {from: accounts[0]});
    try {
      await contract.acceptFulfillment(0,0, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });

  it("verifies that issuer must redeposit sufficient funds after killing a bounty", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    await contract.fulfillBounty("data",  0, {from: accounts[2]});

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    await contract.killBounty({from: accounts[0]});

    let balance = await web3.eth.getBalance(contract.address);
    assert(balance == 1000);



    try {
      await contract.activateBounty(2000, {from: accounts[0], value: 2000});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("verifies that reactivating a bounty works when the sufficient amount is deposited", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    await contract.fulfillBounty("data",  0, {from: accounts[2]});

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    await contract.killBounty({from: accounts[0]});

    let balance = await web3.eth.getBalance(contract.address);
    assert(balance == 1000);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    balance = await web3.eth.getBalance(contract.address);
    assert(balance == 4000);

    await contract.fulfillBounty("data",  0, {from: accounts[3]});

    await contract.acceptFulfillment(0,1, {from: accounts[0]});

    await contract.fulfillBounty("data",  1, {from: accounts[3]});

    await contract.acceptFulfillment(1,0, {from: accounts[0]});

    await contract.fulfillBounty("data",  2, {from: accounts[3]});

    await contract.acceptFulfillment(2,0, {from: accounts[0]});

    let unpaid = await contract.amountToPay();
    assert (unpaid == 4000);

    await contract.fulfillmentPayment(0,0, {from: accounts[2]});

    await contract.fulfillmentPayment(0,1, {from: accounts[3]});

    await contract.fulfillmentPayment(1,0, {from: accounts[3]});

    await contract.fulfillmentPayment(2,0, {from: accounts[3]});

    unpaid = await contract.amountToPay();
    assert (unpaid == 0);

    balance = await web3.eth.getBalance(contract.address);
    assert(balance == 0);

  });

  it("verifies that increasing a payout amount for an unaccepted fulfillment works", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(4000, {from: accounts[0], value: 4000});

    await contract.increasePayout(0, 2000, {from: accounts[0]});

    await contract.fulfillBounty("data", 0, {from: accounts[2]});

    await contract.acceptFulfillment(0,0,{from: accounts[0]});

    var balance = await web3.eth.getBalance(contract.address);
    assert(balance == 4000);

    await contract.fulfillmentPayment(0,0,{from: accounts[2]});

    balance = await web3.eth.getBalance(contract.address);
    assert(balance == 2000);

  });
  it("verifies that increasing a payout amount for an accepted fulfillment works", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(4000, {from: accounts[0], value: 4000});

    await contract.fulfillBounty("data", 0, {from: accounts[2]});

    await contract.acceptFulfillment(0,0,{from: accounts[0]});

    await contract.increasePayout(0, 2000, {from: accounts[0]});

    var balance = await web3.eth.getBalance(contract.address);
    assert(balance == 4000);

    await contract.fulfillmentPayment(0,0,{from: accounts[2]});

    balance = await web3.eth.getBalance(contract.address);
    assert(balance == 2000);
  });
  it("verifies that increasing a payout amount with too small of a balance fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});


    try {
      await contract.increasePayout(0, 2000, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that accepting a milestone too many times to pay out the remaining milestones, fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    await contract.fulfillBounty("data", 0, {from: accounts[2]});
    await contract.fulfillBounty("data", 0, {from: accounts[3]});
    await contract.fulfillBounty("data", 1, {from: accounts[2]});
    await contract.fulfillBounty("data", 2, {from: accounts[2]});

    await contract.acceptFulfillment(0,0,{from: accounts[0]});

    try {
      await contract.acceptFulfillment(0,1,{from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that accepting a milestone too many times to pay out the remaining accepted milestones, fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});

    await contract.fulfillBounty("data", 0, {from: accounts[2]});
    await contract.fulfillBounty("data", 0, {from: accounts[3]});
    await contract.fulfillBounty("data", 1, {from: accounts[2]});
    await contract.fulfillBounty("data", 2, {from: accounts[2]});

    await contract.acceptFulfillment(0,0,{from: accounts[0]});
    await contract.acceptFulfillment(1,0,{from: accounts[0]});
    await contract.acceptFulfillment(2,0,{from: accounts[0]});

    try {
      await contract.acceptFulfillment(0,1,{from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that increasing the payout with a lower amount fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(4000, {from: accounts[0], value: 4000});

    try {
      await contract.increasePayout(0, 900, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that increasing the payout for already approved milestones that would go over budget fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000],
                                            3000,
                                            0x0);
    await contract.activateBounty(5000, {from: accounts[0], value: 5000});

    await contract.fulfillBounty("data", 0, {from: accounts[2]});
    await contract.fulfillBounty("data", 0, {from: accounts[3]});
    await contract.fulfillBounty("data", 1, {from: accounts[3]});
    await contract.fulfillBounty("data", 2, {from: accounts[3]});

    await contract.acceptFulfillment(0,0,{from: accounts[0]});
    await contract.acceptFulfillment(0,1,{from: accounts[0]});
    await contract.acceptFulfillment(1,0,{from: accounts[0]});
    await contract.acceptFulfillment(2,0,{from: accounts[0]});

    try {
      await contract.increasePayout(0, 2000, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });

  it("verifies that increasing the payout for milestones which haven't been approved that would go over budget fails", async () => {
    let contract = await StandardBounty.new(accounts[0],
                                            2528821098,
                                            "",
                                            [1000,1000,1000,1000],
                                            4000,
                                            0x0);
    await contract.activateBounty(5000, {from: accounts[0], value: 5000});

    await contract.fulfillBounty("data", 0, {from: accounts[3]});
    await contract.fulfillBounty("data", 1, {from: accounts[3]});
    await contract.fulfillBounty("data", 2, {from: accounts[3]});
    await contract.fulfillBounty("data", 3, {from: accounts[3]});


    await contract.acceptFulfillment(0,0,{from: accounts[0]});
    await contract.acceptFulfillment(1,0,{from: accounts[0]});


    await contract.fulfillmentPayment(0,0,{from: accounts[3]});
    await contract.fulfillmentPayment(1,0,{from: accounts[3]});

    try {
      await contract.increasePayout(2, 2000, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });

});
