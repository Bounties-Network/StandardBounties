const StandardBounties = artifacts.require("../contracts/StandardBounties");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");

const utils = require('./helpers/Utils');


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

  it("[BOTH] Verifies that I can issue new bounties and retreive them as needed", async () => {

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
        let total = await registry.getNumBounties();
        assert(bounty[3] == true);
        assert(tokenAddress == bountyToken.address)
        assert(data == ("data"+i));
        assert(total == (i+1));
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
        let total = await registry.getNumBounties();
        assert(bounty[3] == false);
        assert(tokenAddress == "0x0000000000000000000000000000000000000000")
        assert(data == ("data"+i));
        assert(total == (i+1));

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
        await registry.fulfillBounty(i, "data", {from: accounts[1]});
        await registry.fulfillBounty(i, "data", {from: accounts[1]});
        await registry.fulfillBounty(i, "data", {from: accounts[1]});

        await registry.acceptFulfillment(i,0,{from: accounts[0]});

        var bounty = await registry.getBounty(i);
        assert(bounty[5] == 0);


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
        await registry.fulfillBounty(i, "data", {from: accounts[1]});
        await registry.fulfillBounty(i, "data", {from: accounts[1]});
        await registry.fulfillBounty(i, "data", {from: accounts[1]});

        await registry.acceptFulfillment(i,0,{from: accounts[0]});

        var bounty = await registry.getBounty(i);
        assert(bounty[5] == 0);



      }
    }
  });
  it("[BOTH] Verifies that I can issue, activate, fulfill many times, accept, and pay out new bounties paying in both ETH and Tokens", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    for (var i = 0; i < 10; i++){
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

        for (var j = 0; j < 50; j++){
          await registry.fulfillBounty(i, "data", {from: accounts[1]});
          var numFul = await registry.getNumFulfillments(i);
          assert(numFul == (j+1));
        }

        var random = Math.floor(Math.random() * 49);

        await registry.acceptFulfillment(i,random,{from: accounts[0]});
        var bounty = await registry.getBounty(i);
        assert(bounty[5] == 0);


      } else {

        await registry.issueBounty(accounts[0],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0,{from: accounts[0]});

        await registry.activateBounty(i,1000, {from: accounts[0], value: 1000});

        for (var j = 0; j < 50; j++){
          await registry.fulfillBounty(i, "data", {from: accounts[1]});
          var numFul = await registry.getNumFulfillments(i);
          assert(numFul == (j+1));
        }

        var random = Math.floor(Math.random() * 49);

        await registry.acceptFulfillment(i,random,{from: accounts[0]});

        var bounty = await registry.getBounty(i);
        assert(bounty[5] == 0);
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
          var bounty = await registry.getBounty(i);
          assert(bounty[5] == 0);
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

          var bounty = await registry.getBounty(i);
          assert(bounty[5] == 0);
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

        var bounty = await registry.getBounty(i);
        assert(bounty[5] == 0);
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


    try {
      await registry.acceptFulfillment(0,4,{from: accounts[0]});

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



    try {
      await registry.acceptFulfillment(0,4,{from: accounts[0]});
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

          var bounty = await registry.getBounty(i);
          assert(bounty[5] == 0);
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

          var bounty = await registry.getBounty(i);
          assert(bounty[5] == 0);
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

        var bounty = await registry.getBounty(i);
        assert(bounty[5] == 0);
      }
    }

    let balance1 = await bountyToken.balanceOf(registry.address);
    assert(balance1 == 0);
    let balance2 = await bountyToken2.balanceOf(registry.address);
    assert(balance2 == 0);
    let balance3 = await web3.eth.getBalance(registry.address);
    assert(balance3 == 0);
  });

});
