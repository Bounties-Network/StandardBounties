const StandardBounties = artifacts.require("../contracts/StandardBounties");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");

const utils = require('./helpers/Utils');
const BN = require(`bn.js`);


contract('StandardBounties', function(accounts) {

  it("[ETH] Verifies that I can issue new bounties paying in ETH", async () => {

    let registry = await StandardBounties.new(accounts[0]);

    for (var i = 0; i < 100; i++){
      await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                  2528821098,
                                  "data"+i,
                                  1000,
                                  0x0,
                                  false,
                                  0x0,{from: accounts[0]});
      let data = await registry.getBountyData(i);
      assert(data == ("data"+i));

    }



  });

  it("[TOKENS] Verifies that I can issue new bounties paying in Tokens", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    for (var i = 0; i < 100; i++){
      await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                  2528821098,
                                  "data"+i,
                                  1000,
                                  0x0,
                                  true,
                                  bountyToken.address,{from: accounts[0]});
      let data = await registry.getBountyData(i);
      assert(data == ("data"+i));

    }



  });

  it("[BOTH] Verifies that I can issue new bounties paying in both ETH and Tokens", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    for (var i = 0; i < 100; i++){
      if (i % 2){
        await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    true,
                                    bountyToken.address, {from: accounts[0]});
        let data = await registry.getBountyData(i);
        let bounty = await registry.getBounty(i);
        let tokenAddress = await registry.getBountyToken(i);
        assert(bounty[3] == true);
        assert(tokenAddress == bountyToken.address)
        assert(data == ("data"+i));
      } else {

        await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0, {from: accounts[0]});
        let data = await registry.getBountyData(i);
        let bounty = await registry.getBounty(i);
        let tokenAddress = await registry.getBountyToken(i);
        assert(bounty[3] == false);
        assert(tokenAddress == "0x0000000000000000000000000000000000000000")
        assert(data == ("data"+i));

      }
    }



  });

  it("[BOTH] Verifies that I can issue, activate, fulfill, accept, and pay out new bounties paying in both ETH and Tokens", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      if (i % 2){
        await registry.issueBounty(accounts[0],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    true,
                                    bountyToken.address,{from: accounts[0]});

        await bountyToken.approve(registry.address, 1000, {from: accounts[0]});

        await registry.activateBounty(i,1000, {from: accounts[0]});

        await registry.fulfillBounty(i, "data", {from: accounts[1]});

        await registry.acceptFulfillment(i,0,{from: accounts[0]});

        await registry.fulfillmentPayment(i,0,{from: accounts[1]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);


      } else {

        await registry.issueBounty(accounts[0],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0,{from: accounts[0]});

        await registry.activateBounty(i,1000, {from: accounts[0], value: 1000});

        await registry.fulfillBounty(i, "data", {from: accounts[1]});

        await registry.acceptFulfillment(i,0,{from: accounts[0]});

        await registry.fulfillmentPayment(i,0,{from: accounts[1]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);



      }
    }
  });

  it("[BOTH] Verifies that I can issue, activate, fulfill, accept, and pay out new bounties paying in both ETH and Tokens from various addresses, with various token contracts", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await bountyToken.transfer(accounts[1], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[2], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[3], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[4], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[5], 100000000, {from: accounts[0]});

    let bountyToken2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2", {from: accounts[0]});

    await bountyToken2.transfer(accounts[1], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[2], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[3], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[4], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[5], 100000000, {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      if (i % 2){
        if (i % 4){
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 1000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,1000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        } else {
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken2.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 1000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,1000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        }



      } else {

        await registry.issueBounty(accounts[(i%5)],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0,{from: accounts[(i%5)]});

        await registry.activateBounty(i,1000, {from: accounts[(i%5)], value: 1000});

        await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});

        await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});

        await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);
      }
    }

    let balance1 = await bountyToken.balanceOf(registry.address);
    assert(balance1 == 0);
    let balance2 = await bountyToken2.balanceOf(registry.address);
    assert(balance2 == 0);
    let balance3 = await web3.eth.getBalance(registry.address);
    assert(balance3 == 0);
  });

  it("[BOTH] Verifies that I can't edit someone else's bounty", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});
    await bountyToken.transfer(accounts[1], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[2], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[3], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[4], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[5], 100000000, {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      await registry.issueBounty(accounts[(i%5)],
                                  2528821098,
                                  "data"+i,
                                  1000,
                                  0x0,
                                  true,
                                  bountyToken.address,{from: accounts[0]});
      if(i !== 0){
        try {
          await registry.transferIssuer((i-1), accounts[(i%5)], {from: accounts[(i%5)]});
        } catch (error){
          return utils.ensureException(error);
        }
      }
    }
  });

  it("[TOKENS] Verifies that accessing an out of bounds bountyId fails", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    for (var i = 0; i < 10; i++){
      await registry.issueBounty(accounts[(i%5)],
                                  2528821098,
                                  "data"+i,
                                  1000,
                                  0x0,
                                  true,
                                  bountyToken.address,{from: accounts[0]});
    }
    try {
      await registry.transferIssuer(10, accounts[0], {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] Verifies that accessing an out of bounds fulfillmentId fails", async () => {

    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,{from: accounts[0]});


    await registry.activateBounty(0 ,1000, {from: accounts[0], value: 1000});

    await registry.fulfillBounty(0, "data1", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});
    await registry.fulfillBounty(0, "data4", {from: accounts[4]});

    await registry.acceptFulfillment(0,3,{from: accounts[0]});

    try {
      await registry.fulfillmentPayment(0,4, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("[TOKENS] Verifies that accessing an out of bounds fulfillmentId fails", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                true,
                                bountyToken.address,{from: accounts[0]});

    await bountyToken.approve(registry.address, 1000, {from: accounts[0]});

    await registry.activateBounty(0 ,1000, {from: accounts[0]});


    await registry.fulfillBounty(0, "data1", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});
    await registry.fulfillBounty(0, "data4", {from: accounts[4]});

    await registry.acceptFulfillment(0,3,{from: accounts[0]});

    try {
      await registry.fulfillmentPayment(0,4, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });


  it("[BOTH] Verifies that I can issue, activate, fulfill, accept, and pay out new bounties paying in both ETH and Tokens from various addresses, with various token contracts, with several fulfillments", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await bountyToken.transfer(accounts[1], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[2], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[3], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[4], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[5], 100000000, {from: accounts[0]});

    let bountyToken2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2", {from: accounts[0]});

    await bountyToken2.transfer(accounts[1], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[2], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[3], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[4], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[5], 100000000, {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      if (i % 2){
        if (i % 4){
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 3000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,3000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});
          await registry.fulfillBounty(i, "data2", {from: accounts[(i%5)+2]});
          await registry.fulfillBounty(i, "data3", {from: accounts[(i%5)+3]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,1,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,2,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          await registry.fulfillmentPayment(i,1,{from: accounts[(i%5)+2]});
          await registry.fulfillmentPayment(i,2,{from: accounts[(i%5)+3]});
          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        } else {
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken2.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 3000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,3000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});
          await registry.fulfillBounty(i, "data2", {from: accounts[(i%5)+2]});
          await registry.fulfillBounty(i, "data3", {from: accounts[(i%5)+3]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,1,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,2,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          await registry.fulfillmentPayment(i,1,{from: accounts[(i%5)+2]});
          await registry.fulfillmentPayment(i,2,{from: accounts[(i%5)+3]});

          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        }



      } else {

        await registry.issueBounty(accounts[(i%5)],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0,{from: accounts[(i%5)]});

        await registry.activateBounty(i,3000, {from: accounts[(i%5)], value: 3000});

        await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});
        await registry.fulfillBounty(i, "data2", {from: accounts[(i%5)+2]});
        await registry.fulfillBounty(i, "data3", {from: accounts[(i%5)+3]});

        await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});
        await registry.acceptFulfillment(i,1,{from: accounts[(i%5)]});
        await registry.acceptFulfillment(i,2,{from: accounts[(i%5)]});

        await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
        await registry.fulfillmentPayment(i,1,{from: accounts[(i%5)+2]});
        await registry.fulfillmentPayment(i,2,{from: accounts[(i%5)+3]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);
      }
    }

    let balance1 = await bountyToken.balanceOf(registry.address);
    assert(balance1 == 0);
    let balance2 = await bountyToken2.balanceOf(registry.address);
    assert(balance2 == 0);
    let balance3 = await web3.eth.getBalance(registry.address);
    assert(balance3 == 0);
  });


/*
  it("[ETH] verifies that bounty fulfillment flow works to completion with several fulfillments", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    let fulfillment = await registry.getFulfillment(0,0);

    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);

    await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    var bounty = await registry.getBounty(0);
    assert(bounty[6] == 0);
  });
  it("[ETH] verifies that claiming payment twice fails when balance is 0", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    let fulfillment = await registry.getFulfillment(0,0);

    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);

    await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    var bounty = await registry.getBounty(0);
    assert(bounty[6] == 0);
    try {
      await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that claiming payment twice fails when balance isn't 0", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    let fulfillment = await registry.getFulfillment(0,0);

    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);

    await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    var bounty = await registry.getBounty(0);
    assert(bounty[6] == 1000);
    try {
      await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that arbiter can't fulfill a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});
    try {
      await registry.fulfillBounty(0, "data", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that issuer can't fulfill a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});
    try {
      await registry.fulfillBounty(0, "data", {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that killing bounty leaves the correct remaining amount for one payment", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});
    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});

    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    let bounty = await registry.getBounty(0);
    let balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 1000);
    assert(bounty[6]== 2000);
    assert(balance == 2000);

    await registry.killBounty(0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 1000);
    assert(bounty[6]== 1000);
    assert(balance == 1000);

    await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 0);
    assert(bounty[6]== 0);
    assert(balance == 0);
  });
  it("[ETH] verifies that killing bounty leaves the correct remaining amount for several payments", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,3000, {from: accounts[0], value: 3000});
    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});

    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    let bounty = await registry.getBounty(0);
    let balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 1000);
    assert(bounty[6]== 3000);
    assert(balance == 3000);

    await registry.acceptFulfillment(0,2,{from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 2000);
    assert(bounty[6]== 3000);
    assert(balance == 3000);

    await registry.killBounty(0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 2000);
    assert(bounty[6]== 2000);
    assert(balance == 2000);

    await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 1000);
    assert(bounty[6]== 1000);
    assert(balance == 1000);

    await registry.fulfillmentPayment(0,2,{from: accounts[3]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 0);
    assert(bounty[6]== 0);
    assert(balance == 0);
  });

  it("[ETH] verifies that accepting too many bounties because of unpaid fulfillments isn't allowed", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});
    let bounty = await registry.getBounty(0);
    let balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 0);
    assert(bounty[6]== 1000);
    assert(balance == 1000);
    await registry.acceptFulfillment(0,2,{from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 1000);
    assert(bounty[6]== 1000);
    assert(balance == 1000);
    try {
      await registry.acceptFulfillment(0,2,{from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that accepting too many bounties because of paid fulfillments isn't allowed", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});
    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});
    let bounty = await registry.getBounty(0);
    let balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 0);
    assert(bounty[6]== 1000);
    assert(balance == 1000);
    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 1000);
    assert(bounty[6]== 1000);
    assert(balance == 1000);
    await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 0);
    assert(bounty[6]== 0);
    assert(balance == 0);
    try {
      await registry.acceptFulfillment(0,2,{from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that claiming payment for someone else's bounty fulfillment isn't allowed", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});
    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    await registry.fulfillBounty(0, "data3", {from: accounts[3]});
    let bounty = await registry.getBounty(0);
    let balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 0);
    assert(bounty[6]== 1000);
    assert(balance == 1000);
    await registry.acceptFulfillment(0,1,{from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 1000);
    assert(bounty[6]== 1000);
    assert(balance == 1000);
    try {
      await registry.fulfillmentPayment(0,1,{from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that accepting an already accepted fulfillment fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data", {from: accounts[2]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == true);

    try {
      await registry.acceptFulfillment(0,0,{from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that accepting a paid fulfillment fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,1000, {from: accounts[0], value: 1000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data", {from: accounts[2]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] == false);
    assert(fulfillment[1] == true);

    await registry.fulfillmentPayment(0,0,{from: accounts[1]});

    fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] == true);
    assert(fulfillment[1] == true);

    try {
      await registry.acceptFulfillment(0,0,{from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that issuer can transfer ownership of a draft bounty to a new account", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.transferIssuer(0, accounts[1], {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[0] == accounts[1]);

  });
  it("[ETH] verifies that issuer can transfer ownership of an active bounty to a new account", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0, 1000,  {from: accounts[0], value: 1000});
    await registry.transferIssuer(0, accounts[1], {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[0] == accounts[1]);
  });
  it("[ETH] verifies that issuer can extend the deadline of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    await registry.extendDeadline(0, 2528821099, {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[1] == 2528821099);
  });

  it("[ETH] verifies that issuer can extend the deadline of an active bounty into an earlier date", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.extendDeadline(0, 2528821097, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that issuer can extend the deadline of an active bounty into a much earlier date", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.extendDeadline(0, 2028821097, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that I can change the issuer of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.changeBountyIssuer(0, accounts[1], {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[0] == accounts[1]);

  });
  it("[ETH] verifies that I can change the deadline of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.changeBountyDeadline(0, 2028821098, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[1] == 2028821098);

  });
  it("[ETH] verifies that I can change the data of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.changeBountyData(0, "newData", {from: accounts[0]});

    let bounty = await registry.getBountyData(0);
    assert(bounty == "newData");

  });
  it("[ETH] verifies that I can decrease the fulfillment amount of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.changeBountyFulfillmentAmount(0, 500, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 500);
  });
  it("[ETH] verifies that I can increase the fulfillment amount of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.changeBountyFulfillmentAmount(0, 2000, {from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
  });

  it("[ETH] verifies that I can change the arbiter of a draft bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                false,
                                0x0,
                                {from: accounts[0]});
    let arbiter = await registry.getBountyArbiter(0);
    assert(arbiter == accounts[1]);
    await registry.changeBountyArbiter(0, accounts[2], {from: accounts[0]});

    arbiter = await registry.getBountyArbiter(0);
    assert(arbiter == accounts[2]);

  });

  it("[ETH] verifies that I can't change the issuer of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.changeBountyIssuer(0, accounts[1], {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("[ETH] verifies that I can't change the deadline of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});

    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.changeBountyDeadline(0, 2028821098, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("[ETH] verifies that I can't change the data of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.changeBountyData(0, "newData", {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });
  it("[ETH] verifies that I can't decrease the fulfillment amount of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.changeBountyFulfillmentAmount(0, 500, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that I can't increase the fulfillment amount of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});

    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.changeBountyFulfillmentAmount(0, 2000, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that I can't change the arbiter of an active bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                accounts[1],
                                false,
                                0x0,
                                {from: accounts[0]});

    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});
    try {
      await registry.changeBountyArbiter(0, accounts[2], {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });

  it("[ETH] verifies that issuer must redeposit funds after killing a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);
    assert(bounty[6] == 2000);

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);
    assert(bounty[6] == 1000);

    try {
      await registry.activateBounty(0, 0, {from: accounts[0], value: 0});

    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that issuer must redeposit sufficient funds to pay a fulfillment after killing a bounty", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);
    assert(bounty[6] == 2000);

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);
    assert(bounty[6] == 1000);

    try {
      await registry.activateBounty(0, 500, {from: accounts[0], value: 500});

    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that reactivating a bounty works when the sufficient amount is deposited", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    let bounty = await registry.getBounty(0);
    assert(bounty[5] == 1000);
    assert(bounty[6] == 2000);

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[4] == 2);

    await registry.activateBounty(0, 1000, {from: accounts[0], value: 1000});

    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);

  });

  it("[ETH] verifies that increasing a payout amount for an unaccepted fulfillment works", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 0);
    assert(bounty[6] == 2000);

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 0);
    assert(bounty[6] == 2000);

    await registry.increasePayout(0,2000, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 0);
    assert(bounty[6] == 2000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[5] == 2000);
    assert(bounty[6] == 2000);

    await registry.fulfillmentPayment(0,0,{from: accounts[1]});
    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);
    assert(bounty[6] == 0);


  });
  it("[ETH] verifies that increasing a payout amount for an accepted fulfillment works", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,2000, {from: accounts[0], value: 2000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 0);
    assert(bounty[6] == 2000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 1000);
    assert(bounty[6] == 2000);

    await registry.increasePayout(0,2000, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 2000);
    assert(bounty[6] == 2000);

    await registry.fulfillmentPayment(0,0,{from: accounts[1]});
    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 0);
    assert(bounty[6] == 0);


  });

  it("[ETH] verifies that increasing a payout amount for several accepted fulfillments works", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,5000, {from: accounts[0], value: 5000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});
    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 0);
    assert(bounty[6] == 5000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 1000);
    assert(bounty[6] == 5000);

    await registry.acceptFulfillment(0,1, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 2000);
    assert(bounty[6] == 5000);

    await registry.increasePayout(0,2000, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 4000);
    assert(bounty[6] == 5000);

    await registry.fulfillmentPayment(0,0,{from: accounts[1]});
    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 2000);
    assert(bounty[6] == 3000);

    await registry.fulfillmentPayment(0,1,{from: accounts[2]});
    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 0);
    assert(bounty[6] == 1000);


  });

  it("[ETH] verifies that increasing a payout amount with too small of a balance fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,3000, {from: accounts[0], value: 3000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    await registry.acceptFulfillment(0,1, {from: accounts[0]});

    try {
      await registry.increasePayout(0,2000, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }



  });
  it("[ETH] verifies that increasing the payout with a lower amount fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.activateBounty(0,3000, {from: accounts[0], value: 3000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    await registry.fulfillBounty(0, "data2", {from: accounts[2]});

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    await registry.acceptFulfillment(0,1, {from: accounts[0]});

    try {
      await registry.increasePayout(0,900, {from: accounts[0]});
    } catch(error){
      return utils.ensureException(error);
    }

  });

  it("[ETH] verifies that I can change a bounty with no balance from paying in ETH to paying in Tokens", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    let bounty = await registry.getBounty(0);
    assert(bounty[3] == false);

    await registry.changeBountyPaysTokens(0, true, 0x0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[3] == true);
    assert(bounty[6] == 0);
    assert(balance == 0);

  });

  it("[ETH] verifies that I can change a bounty with a balance from paying in ETH to paying in Tokens", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.contribute(0, 3000, {from: accounts[0], value: 3000});
    var bounty = await registry.getBounty(0);
    var balance = await web3.eth.getBalance(registry.address);
    assert(bounty[6] == 3000);
    assert(balance == 3000);

    await registry.changeBountyPaysTokens(0, true, 0x0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[3] == true);
    assert(bounty[6] == 0);
    assert(balance == 0);

  });


*/
});
