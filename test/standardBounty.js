const StandardBounty = artifacts.require("../contracts/StandardBounty");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");

const utils = require('./helpers/Utils');


contract('StandardBounty', function(accounts) {


  it("Verifies that I can deploy a standard bounty", async () => {

    let stdb = await StandardBounty.new();

  });

  it("Verifies that I can initialize a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);


  });

  it("Verifies that I can't initialize a standard bounty with the 0 address", async () => {

    let stdb = await StandardBounty.new();

    try {
      await stdb.initializeBounty("0x0000000000000000000000000000000000000000", accounts[1], "0xdeadbeef", {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't initialize a standard bounty twice", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    try {
      await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can send ETH to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await web3.eth.sendTransaction({from: accounts[0], to: stdb.address, value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

  });

  it("Verifies that I can send tokens to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.transfer(stdb.address, 100, {from: accounts[0]});

    let balance = await stdt.balanceOf(stdb.address);

    assert(parseInt(balance, 10) === 100);


  });

  it("Verifies that I can send both ETH and tokens to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await web3.eth.sendTransaction({from: accounts[0], to: stdb.address, value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.transfer(stdb.address, 100, {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 100);


  });

  it("Verifies that I can refundableContribute to a standard bounty with ETH", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[1], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

  });

  it("Verifies that I can refundableContribute to a standard bounty with tokens", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.approve(stdb.address, 100, {from: accounts[0]});

    await stdb.refundableContribute([100], [stdt.address], {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 100);

  });

  it("Verifies that I can refundableContribute to a standard bounty with both ETH and tokens", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000, 100], [stdt.address, "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    let balance = await web3.eth.getBalance(stdb.address);

    (parseInt(balance, 10) === 100);


  });

  it("Verifies that I can't refundableContribute to a standard bounty with the wrong token amounts", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    try {
      await stdb.refundableContribute([10000], [stdt.address], {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with the wrong ETH amount", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    try {
      await stdb.refundableContribute([10000], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with an amounts array length", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    try {
      await stdb.refundableContribute([100, 1000, 100], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with  the same token twice", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    try {
      await stdb.refundableContribute([1000, 1000], [stdt.address, stdt.address], {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with ETH twice", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    try {
      await stdb.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 1000});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can refund a refundableContribute in ETH", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.refundContribution(0, {from: accounts[0]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);


  });

  it("Verifies that I can refund a refundableContribute in tokens", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000], [stdt.address], {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.refundContribution(0, {from: accounts[0]});

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can refund a refundableContribute in both tokens and ETH simultaneously", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000, 1000], [stdt.address, "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 1000});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 1000);

    await stdb.refundContribution(0, {from: accounts[0]});

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);


  });

  it("Verifies that I can't refund a refundableContribute twice", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.refundContribution(0, {from: accounts[0]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    try {
      await stdb.refundContribution(0, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refund someone else's refundableContribute", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await stdb.refundContribution(0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can't refund a refundableContribute that has already paid", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty(accounts[2], "data");

    await stdb.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000"]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    try {
      await stdb.refundContribution(0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can fulfill a bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty(accounts[2], "data");

  });

  it("Verifies that I can't fulfill a bounty if I am the issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await stdb.fulfillBounty(accounts[0], "data");

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't fulfill a bounty if I am the arbiter", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await stdb.fulfillBounty(accounts[1], "data");

    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can update my fulfillment", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.updateFulfillment(0, "data2", {from: accounts[2]});

    fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data2");

  });

  it("Verifies that I can't update someone else's fulfillment", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await stdb.updateFulfillment(0, "data2", {from: accounts[3]});

    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("Verifies that I can't update an out-of-bounds fulfillment", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await stdb.updateFulfillment(1, "data2", {from: accounts[2]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't update a fulfillment that has paid out", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000"]);


    try {
      await stdb.updateFulfillment(0, "data2", {from: accounts[2]});

    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can accept a fulfillment paying out some tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000"]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);


  });

  it("Verifies that I can accept a fulfillment paying out all tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of (only denomenator)", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.acceptFulfillment(0, 1, 2, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 500);

  });

  it("Verifies that I can't accept a fulfillment paying out more tokens than I have a balance of (only numerator)", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await stdb.acceptFulfillment(0, 2, 1, ["0x0000000000000000000000000000000000000000", stdt.address]);
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of (both numerator and denomenator)", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.acceptFulfillment(0, 2, 3, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 34);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 334);

  });

  it("Verifies that I can't accept a fulfillment paying out in tokens I don't have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    let stdt2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await stdb.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address, stdt2.address]);
    } catch (error){
      return utils.ensureException(error);

    }

  });

  it("Verifies that I can accept a fulfillment if I'm an arbiter", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[1]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can accept several fulfillments paying equal fractions", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 1000});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 1000);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data1");
    await stdb.fulfillBounty(accounts[3], "data2");
    await stdb.fulfillBounty(accounts[4], "data3");
    await stdb.fulfillBounty(accounts[5], "data4");

    await stdb.acceptFulfillment(0, 1, 4, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[1]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 750);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 750);

    await stdb.acceptFulfillment(1, 1, 3, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[1]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 500);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 500);

    await stdb.acceptFulfillment(2, 1, 2, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[1]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 250);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 250);

    await stdb.acceptFulfillment(3, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[1]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });


  it("Verifies that I can't accept a fulfillment if I'm not an issuer or an arbiter", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await stdb.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can drain my own bounty before a payout", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can drain my own bounty after a payout", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty(accounts[2], "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await stdb.acceptFulfillment(0, 1, 2, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 500);

    await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can't drain someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 1000);

    try {
      await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    await stdb.changeBounty(accounts[4], accounts[5], "deebdaedx0", {from: accounts[0]});

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === accounts[5]);
    assert(bounty[2] === "deebdaedx0");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    try {
      await stdb.changeBounty(accounts[4], accounts[5], "deebdaedx0", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("Verifies that I can change my own bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    await stdb.changeIssuer(accounts[4], {from: accounts[0]});

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    try {
      await stdb.changeIssuer(accounts[4], {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty's arbiter", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    await stdb.changeArbiter(accounts[4], {from: accounts[0]});

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[4]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);


  });

  it("Verifies that I can't change someone else's bounty's arbiter", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    try {
      await stdb.changeArbiter(accounts[4], {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty's data", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    await stdb.changeData("newData", {from: accounts[0]});

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "newData");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);


  });

  it("Verifies that I can't change someone else's bounty's data", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === accounts[1]);
    assert(bounty[2] === "0xdeadbeef");
    assert(bounty[3] === false);
    assert(parseInt(bounty[4], 10) === 0);

    try {
      await stdb.changeData("newData", {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });



/*
    let registry = await StandardBounties.new(accounts[0]);

    let owner = await registry.owner();

    assert(owner == accounts[0])
*/


  /*

  it("[ETH] Verifies that I can issue a new bounty paying in ETH", async () => {

    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,{from: accounts[0]});

  });

  it("[ETH] verifies that a date before the present will cause a failing construction", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    try {

      await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                  0,
                                  "data",
                                  1000,
                                  0x0,
                                  false,
                                  0x0,{from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("[ETH] verifies that a payout of 0 will fail", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    try {

      await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                  2528821098,
                                  "data",
                                  0,
                                  0x0,
                                  false,
                                  0x0,{from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("[ETH] verifies that simple bounty contribution and activation functions", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});

    await registry.contribute(0,1000, {from: accounts[0], value: 1000});
    let bounty = await registry.getBounty(0);
    assert(bounty[4] == 0);
    await registry.activateBounty(0,0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[ETH] verifies that simple bounty activation functions", async () => {
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
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[ETH] verifies that simple bounty activation functions for more than payout amount", async () => {
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
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[ETH] verifies that simple bounty activation with too small a value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    try {
      await registry.activateBounty(0,500, {from: accounts[0], value: 500});

    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that simple bounty activation with wrong value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    try {
      await registry.activateBounty(0,1000, {from: accounts[0], value: 500});

    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that bounty issuance and activation all in one functions", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueAndActivateBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                1000,
                                {from: accounts[0],value: 1000});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[ETH] verifies that bounty issuance and activation all in one functions for more than payout amount", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueAndActivateBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                5000,
                                {from: accounts[0],value: 5000});
    bounty = await registry.getBounty(0);
    assert(bounty[4] == 1);
  });
  it("[ETH] verifies that bounty issuance and activation with incorrect value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  2528821098,
                                  "data",
                                  1000,
                                  0x0,
                                  false,
                                  0x0,
                                  1000,
                                  {from: accounts[0],value: 500});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that bounty issuance and activation with too small a value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  2528821098,
                                  "data",
                                  1000,
                                  0x0,
                                  false,
                                  0x0,
                                  500,
                                  {from: accounts[0],value: 500});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that bounty issuance and activation with date before today fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  0,
                                  "data",
                                  1000,
                                  0x0,
                                  false,
                                  0x0,
                                  1000,
                                  {from: accounts[0],value: 1000});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that bounty issuance and activation with payout of 0 fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);
    try {
      await registry.issueAndActivateBounty(accounts[0],
                                  2528821098,
                                  "data",
                                  0,
                                  0x0,
                                  false,
                                  0x0,
                                  1000,
                                  {from: accounts[0],value: 1000});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that simple bounty contribution with incorrect value fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    try {
      await registry.contribute(0,1000, {from: accounts[0], value: 500});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that simple bounty contribution with a value of 0 fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    try {
      await registry.contribute(0,0, {from: accounts[0], value: 0});
    } catch (error){
      return utils.ensureException(error);
    }

  });
  it("[ETH] verifies that activation before the bounty has sufficient funds fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});

    await registry.contribute(0,500, {from: accounts[0], value: 500});
    try {
      await registry.activateBounty(0,0, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that activation from non-issuer fails", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});

    await registry.contribute(0,1000, {from: accounts[0], value: 1000});
    try {
      await registry.activateBounty(0,0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that contribution fails for dead bounties", async () => {
    let registry = await StandardBounties.new(accounts[0]);

    await registry.issueBounty(accounts[0],
                                2528821098,
                                "data",
                                1000,
                                0x0,
                                false,
                                0x0,
                                {from: accounts[0]});
    await registry.killBounty(0);
    try {
      await registry.contribute(0,500, {from: accounts[0], value: 500});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that basic fulfillment acceptance flow works", async () => {
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
    let fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] === false);
    await registry.acceptFulfillment(0,0,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[0] === true);
  });
  it("[ETH] verifies that changing a fulfillment works", async () => {
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
    let fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[2] === "data");
    await registry.updateFulfillment(0,0,"data2", {from: accounts[1]});
    fulfillment = await registry.getFulfillment(0,0);
    assert(fulfillment[2] === "data2");
  });

  it("[ETH] verifies that changing an accepted fulfillment fails", async () => {
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
    let fulfillment = await registry.getFulfillment(0,0);
    await registry.acceptFulfillment(0,0,{from: accounts[0]});

    try {
      await registry.updateFulfillment(0,0,"data2", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("[ETH] verifies that changing someone else's fulfillment fails", async () => {
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

    try {
      await registry.updateFulfillment(0,0,"data2", {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }
  });
  it("[ETH] verifies that bounty fulfillment flow works to completion", async () => {
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
    let fulfillment = await registry.getFulfillment(0,0);

    await registry.acceptFulfillment(0,0,{from: accounts[0]});
    fulfillment = await registry.getFulfillment(0,0);

    var bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);
  });
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

    var bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);
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
  it("[ETH] verifies that accepting too many fulfillments isn't allowed", async () => {
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
    assert(bounty[5]== 1000);
    assert(balance == 1000);
    await registry.acceptFulfillment(0,2,{from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[5]== 0);
    assert(balance == 0);
    try {
      await registry.acceptFulfillment(0,2,{from: accounts[0]});
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
    assert(fulfillment[0] == true);

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

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);

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

    await registry.killBounty(0,{from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);

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
    await registry.activateBounty(0,3000, {from: accounts[0], value: 3000});

    await registry.fulfillBounty(0, "data", {from: accounts[1]});
    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 3000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 2000);

    await registry.increasePayout(0,2000, 0,  {from: accounts[0]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 2000);


  });

  it("[ETH] verifies that increasing a payout amount with value works", async () => {
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

    let bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 1000);

    await registry.fulfillBounty(0, "data", {from: accounts[1]});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 1000);
    assert(bounty[5] == 1000);

    await registry.increasePayout(0,2000, 1000, {from: accounts[0], value: 1000});

    bounty = await registry.getBounty(0);
    assert(bounty[2] == 2000);
    assert(bounty[5] == 2000);

    await registry.acceptFulfillment(0,0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    assert(bounty[5] == 0);


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
      await registry.increasePayout(0,2000, 0, {from: accounts[0]});
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

    try {
      await registry.increasePayout(0,900, 0, {from: accounts[0]});
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
    assert(bounty[5] == 0);
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
    assert(bounty[5] == 3000);
    assert(balance == 3000);

    await registry.changeBountyPaysTokens(0, true, 0x0, {from: accounts[0]});
    bounty = await registry.getBounty(0);
    balance = await web3.eth.getBalance(registry.address);
    assert(bounty[3] == true);
    assert(bounty[5] == 0);
    assert(balance == 0);

  });


*/
});
