const StandardBounty = artifacts.require("../contracts/StandardBounty.sol");
const utils = require('./helpers/Utils');
const BN = require(`bn.js`);


contract('StandardBounty', function(accounts) {


  it("verifies that the issuer and state are correct after construction", async () => {

    let contract = await StandardBounty.new(2528821098, "", "", [1000,1000,1000], 3, 0x0);
    let issuer = await contract.issuer.call();
    let stage = await contract.bountyStage.call();


    assert.equal(issuer, accounts[0]);
    assert.equal(stage, 0);

  });

  it("verifies that a date before the present will cause a failing construction", async () => {
    try {
      await StandardBounty.new(0,
                                "",
                                "",
                                [1000,1000,1000],
                                3,
                                0x0);
      assert(false, "didn't throw");
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("verifies that incorrect milestone payouts and num will throw", async () => {
    try {
      await StandardBounty.new(2528821098,
                                "",
                                "",
                                [1000,1000,1000],
                                2,
                                0x0);
      assert(false, "didn't throw");
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("verifies that a milestone payout of 0 will fail", async () => {
    try {
      await StandardBounty.new(2528821098,
                              "",
                              "",
                              [0,1000,1000],
                              3,
                              0x0);
      assert(false, "didn't throw");
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("verifies that simple bounty contribution and activation functions", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);
    await contract.contribute(3000, {from: accounts[0], value: 3000});
    await contract.activateBounty(0, {from: accounts[0]});
    let stage = await contract.bountyStage.call();
    assert(stage == 1);

  });
  it("verifies that simple bounty contribution with incorrect value fails", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);
    try {
      await contract.contribute(4000, {from: accounts[0], value: 3000});
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("verifies that simple bounty contribution with a value of 0 fails", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);
    try {
      await contract.contribute(0, {from: accounts[0], value: 0});
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("verifies that activation before the bounty has sufficient funds fails", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
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
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
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
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);
    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
  });
  it("verifies that activation from non-issuer account fails", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
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
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
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
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
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
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    await contract.fulfillBounty("data", "datatype", 0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let balance2 = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    let balance3 = balance2.add(new BN(5793100000000000 - 1000, 10));
    assert(balance3.toString() === balance.toString());

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 2000);
  });

  it("verifies that basic fulfillment-acceptance flow works", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    /// first fulfillment

    await contract.fulfillBounty("data", "datatype", 0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let balance2 = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    let balance3 = balance2.add(new BN(5793100000000000 - 1000, 10));
    let errorString = "iteration: " + "0" + " Balances: " + balance3.toString() + "  " +  balance.toString();
    assert(balance3.toString() === balance.toString(), errorString);

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-1000);

    /// second fulfillment
    await contract.fulfillBounty("data", "datatype", 1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,1, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,1, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    assert(fulfillment[0] == true);

    balance2 = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    balance3 = balance2.add(new BN(5799500000000000 - 1000, 10));
    errorString = "iteration: " + "1" + " Balances: " + balance3.toString() + "  " +  balance.toString();
    assert(balance3.toString() === balance.toString(), errorString);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-2000);

    /// third fulfillment

    await contract.fulfillBounty("data", "datatype", 2, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(0,2, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,2, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,2, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(2);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,2, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,2, {from: accounts[0]});
    assert(fulfillment[0] == true);

    balance2 = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    balance3 = balance2.add(new BN(5799500000000000 - 1000, 10));
    errorString = "iteration: " + "3" + " Balances: " + balance3.toString() + "  " +  balance.toString();
    assert(balance3.toString() === balance.toString(), errorString);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 0);

  });

  it("verifies that basic fulfillment-acceptance from unique fulfillers works", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    /// first fulfillment

    await contract.fulfillBounty("data", "datatype", 0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let balance2 = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    let balance3 = balance2.add(new BN(5793100000000000 - 1000, 10));
    let errorString = "iteration: " + "0" + " Balances: " + balance3.toString() + "  " +  balance.toString();
    assert(balance3.toString() === balance.toString(), errorString);

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-1000);

    /// second fulfillment
    await contract.fulfillBounty("data", "datatype", 1, {from: accounts[2]});
    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[2]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,1, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[2]).valueOf(), 10);
    await contract.fulfillmentPayment(0,1, {from: accounts[2]});

    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    assert(fulfillment[0] == true);

    balance2 = new BN(await web3.eth.getBalance(accounts[2]).valueOf(), 10);
    balance3 = balance2.add(new BN(5799500000000000 - 1000, 10));
    errorString = "iteration: " + "1" + " Balances: " + balance3.toString() + "  " +  balance.toString();
    assert(balance3.toString() === balance.toString(), errorString);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 3000-2000);

    /// third fulfillment

    await contract.fulfillBounty("data", "datatype", 2, {from: accounts[3]});
    fulfillment = await contract.getFulfillment(0,2, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[3]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,2, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,2, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(2);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    balance = new BN(await web3.eth.getBalance(accounts[3]).valueOf(), 10);
    await contract.fulfillmentPayment(0,2, {from: accounts[3]});

    fulfillment = await contract.getFulfillment(0,2, {from: accounts[0]});
    assert(fulfillment[0] == true);

    balance2 = new BN(await web3.eth.getBalance(accounts[3]).valueOf(), 10);
    balance3 = balance2.add(new BN(5799500000000000 - 1000, 10));
    errorString = "iteration: " + "3" + " Balances: " + balance3.toString() + "  " +  balance.toString();
    assert(balance3.toString() === balance.toString(), errorString);

    contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 0);

  });


  it("verifies that claiming payment twice fails", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    await contract.fulfillBounty("data", "datatype", 0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    let balance = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    await contract.fulfillmentPayment(0,0, {from: accounts[1]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == true);

    let balance2 = new BN(await web3.eth.getBalance(accounts[1]).valueOf(), 10);
    let balance3 = balance2.add(new BN(5793100000000000 - 1000, 10));
    assert(balance3.toString() === balance.toString());

    let contractBalance = new BN (await web3.eth.getBalance(contract.address).valueOf(), 10);
    assert (contractBalance.valueOf() == 2000);
    try {
      await contract.fulfillmentPayment(0,0,{from: accounts[1]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that arbiter can't fulfill a bounty", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            accounts[1]);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    try {
      await contract.fulfillBounty("data", "datatype", 0, {from: accounts[1]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("verifies that killing bounty leaves the correct remaining amount for payment", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    //first fulfillment
    await contract.fulfillBounty("data", "datatype", 0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);
    // Second fulfillment
    await contract.fulfillBounty("data", "datatype", 1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,1, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
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
    await contract.fulfillmentPayment(0,1, {from: accounts[1]});

    balance = await web3.eth.getBalance(contract.address);
    assert (balance == 0);

  });

  it("verifies that accepting too many bounties isn't allowed", async () => {
    let contract = await StandardBounty.new(2528821098,
                                            "",
                                            "",
                                            [1000,1000,1000],
                                            3,
                                            0x0);

    await contract.activateBounty(3000, {from: accounts[0], value: 3000});
    let stage = await contract.bountyStage.call();
    assert (stage == 1);
    //first fulfillment
    await contract.fulfillBounty("data", "datatype", 0, {from: accounts[1]});
    let fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,0, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,0, {from: accounts[0]});
    let numAccepted = await contract.numAccepted.call(0);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);
    // Second fulfillment
    await contract.fulfillBounty("data", "datatype", 1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(0,1, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(0,1, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 1);

    // Third fulfillment
    await contract.fulfillBounty("data", "datatype", 1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(1,1, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    await contract.acceptFulfillment(1,1, {from: accounts[0]});

    fulfillment = await contract.getFulfillment(1,1, {from: accounts[0]});
    numAccepted = await contract.numAccepted.call(1);
    assert(fulfillment[1] == true);
    assert(numAccepted == 2);

    // Fourth fulfillment
    await contract.fulfillBounty("data", "datatype", 1, {from: accounts[1]});
    fulfillment = await contract.getFulfillment(2,1, {from: accounts[0]});
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == false);
    assert(fulfillment[2] == accounts[1]);
    assert(fulfillment[3] == "data");
    assert(fulfillment[4] == "datatype");

    try {
      await contract.acceptFulfillment(2,1, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });





  /*
  it("should call a function that depends on a linked library", function() {
    var meta;
    var metaCoinBalance;
    var metaCoinEthBalance;

    return MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(accounts[0]);
    }).then(function(outCoinBalance) {
      metaCoinBalance = outCoinBalance.toNumber();
      return meta.getBalanceInEth.call(accounts[0]);
    }).then(function(outCoinBalanceEth) {
      metaCoinEthBalance = outCoinBalanceEth.toNumber();
    }).then(function() {
      assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, "Library function returned unexpected function, linkage may be broken");
    });
  });
  it("should send coin correctly", function() {
    var meta;

    // Get initial balances of first and second account.
    var account_one = accounts[0];
    var account_two = accounts[1];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    var amount = 10;

    return MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(account_one);
    }).then(function(balance) {
      account_one_starting_balance = balance.toNumber();
      return meta.getBalance.call(account_two);
    }).then(function(balance) {
      account_two_starting_balance = balance.toNumber();
      return meta.sendCoin(account_two, amount, {from: account_one});
    }).then(function() {
      return meta.getBalance.call(account_one);
    }).then(function(balance) {
      account_one_ending_balance = balance.toNumber();
      return meta.getBalance.call(account_two);
    }).then(function(balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
    });
  });

  */
});
