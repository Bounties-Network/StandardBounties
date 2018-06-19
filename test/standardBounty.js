const StandardBounty = artifacts.require("../contracts/StandardBounty");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");

const utils = require('./helpers/Utils');


contract('StandardBounty', function(accounts) {


  it("Verifies that I can deploy a standard bounty", async () => {

    let stdb = await StandardBounty.new();

  });

  it("Verifies that I can initialize a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);


  });

  it("Verifies that I can't initialize a standard bounty with the 0 address", async () => {

    let stdb = await StandardBounty.new();

    try {
      await stdb.initializeBounty("0x0000000000000000000000000000000000000000", "0xdeadbeef", {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't initialize a standard bounty twice", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can send ETH to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await web3.eth.sendTransaction({from: accounts[0], to: stdb.address, value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

  });

  it("Verifies that I can send tokens to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.transfer(stdb.address, 100, {from: accounts[0]});

    let balance = await stdt.balanceOf(stdb.address);

    assert(parseInt(balance, 10) === 100);


  });

  it("Verifies that I can send both ETH and tokens to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[1], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

  });

  it("Verifies that I can refundableContribute to a standard bounty with tokens", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.approve(stdb.address, 100, {from: accounts[0]});

    await stdb.refundableContribute([100], [stdt.address], {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 100);

  });

  it("Verifies that I can refundableContribute to a standard bounty with both ETH and tokens", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000, 100], [stdt.address, "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    let balance = await web3.eth.getBalance(stdb.address);

    (parseInt(balance, 10) === 100);


  });

  it("Verifies that I can't refundableContribute to a standard bounty with the wrong token amounts", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    try {
      await stdb.refundableContribute([10000], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with an amounts array length", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    try {
      await stdb.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 1000});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can refund a refundableContribute in ETH", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.refundContribution(0, {from: accounts[0]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);


  });

  it("Verifies that I can refund a refundableContribute in tokens", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000], [stdt.address], {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.refundContribution(0, {from: accounts[0]});

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can refund a refundableContribute in both tokens and ETH simultaneously", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000, 1000], [stdt.address, "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 1000});

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000"], [100]);

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

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

  });

  it("Verifies that I can't fulfill a bounty if I am the issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await stdb.fulfillBounty([accounts[0]], [1], 1, "data");

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can accept a fulfillment paying out some tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000"], [100]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);


  });

  it("Verifies that I can accept a fulfillment paying out all tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [100, 1000]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of (only denomenator)", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [50, 500]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 500);

  });

  it("Verifies that I can't accept a fulfillment paying out more tokens than I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    try {
      await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [110, 1000]);
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [66, 666]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 34);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 334);

  });

  it("Verifies that I can't accept a fulfillment paying out in tokens I don't have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    let stdt2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    let tokenBalance2 = await stdt2.balanceOf(stdb.address);

    (parseInt(tokenBalance2, 10) === 0);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    try {
      await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address, stdt2.address], [100, 1000, 1000]);
    } catch (error){
      return utils.ensureException(error);

    }

  });

  it("Verifies that I can accept several fulfillments paying equal fractions", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 1000});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 1000);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data1");
    await stdb.fulfillBounty([accounts[3]], [1], 1, "data2");
    await stdb.fulfillBounty([accounts[4]], [1], 1, "data3");
    await stdb.fulfillBounty([accounts[5]], [1], 1, "data4");

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250], {from: accounts[0]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 750);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 750);

    await stdb.acceptFulfillment(1, ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250], {from: accounts[0]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 500);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 500);

    await stdb.acceptFulfillment(2, ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250],  {from: accounts[0]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 250);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 250);

    await stdb.acceptFulfillment(3, ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250], {from: accounts[0]});

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });


  it("Verifies that I can't accept a fulfillment if I'm not an issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    try {
      await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [100,1000], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can drain my own bounty before a payout", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can drain my own bounty after a payout", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [50, 500]);

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

  it("Verifies that I can fulfill and accept paying out all tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [100, 1000]);

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });
  it("Verifies that I can accept a fulfillment paying out some tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data",["0x0000000000000000000000000000000000000000"], [100]);

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);


  });

  it("Verifies that I can fulfill and accept a fulfillment paying out all tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [100, 1000]);

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);


  });

  it("Verifies that I can fulfill and accept a fulfillment paying out a fraction of the tokens I have a balance of (only denomenator)", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [50, 500]);

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 500);

  });

  it("Verifies that I can't fulfill and accept a fulfillment paying out more tokens than I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    try {
      await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data",["0x0000000000000000000000000000000000000000", stdt.address], [110, 1000]);
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can fulfill and accept a fulfillment paying out a fraction of the tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data",["0x0000000000000000000000000000000000000000", stdt.address], [66, 666]);

    let fulfillment = await stdb.getFulfillment(0);

    assert(fulfillment[3] === "data");

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 34);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 334);

  });

  it("Verifies that I can't fulfill and accept a fulfillment paying out in tokens I don't have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    let stdt2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    let tokenBalance2 = await stdt2.balanceOf(stdb.address);

    (parseInt(tokenBalance2, 10) === 0);

    try {
      await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address, stdt2.address], [100, 1000, 1000]);
    } catch (error){
      return utils.ensureException(error);

    }

  });

  it("Verifies that I can fulfill and accept several fulfillments paying equal fractions", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 1000});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 1000);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data1", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 750);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 750);

    await stdb.fulfillAndAccept([accounts[3]], [1], 1, "data2", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);


    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 500);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 500);

    await stdb.fulfillAndAccept([accounts[4]], [1], 1, "data3", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 250);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 250);

    await stdb.fulfillAndAccept([accounts[5]], [1], 1, "data4", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);

    balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdb.address);

    (parseInt(tokenBalance, 10) === 0);

  });


  it("Verifies that I can't fulfill and accept if I'm not an issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    try {
      await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [100,1000], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't drain someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdb.address, 1000);

    await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(stdb.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdb.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    try {
      await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    await stdb.changeBounty(accounts[4], "deebdaedx0", {from: accounts[0]});

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === "deebdaedx0");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await stdb.changeBounty(accounts[4], "deebdaedx0", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("Verifies that I can change my own bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    await stdb.changeController(accounts[4], {from: accounts[0]});

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await stdb.changeController(accounts[4], {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty's data", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    await stdb.changeData("newData", {from: accounts[0]});

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "newData");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);


  });

  it("Verifies that I can't change someone else's bounty's data", async () => {

    let stdb = await StandardBounty.new();

    await stdb.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await stdb.changeData("newData", {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

});
