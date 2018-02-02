const StandardBounty = artifacts.require("../contracts/StandardBounty");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");
const Proxy = artifacts.require("../contracts/inherited/Proxy");

const utils = require('./helpers/Utils');


contract('StandardBountyProxy', function(accounts) {


  it("Verifies that I can deploy a standard bounty and a proxy that points to it", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

  });

  it("Verifies that I can initialize a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);


  });

  it("Verifies that I can't initialize a standard bounty with the 0 address", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);


    try {
      await newBounty.initializeBounty("0x0000000000000000000000000000000000000000", "0xdeadbeef", {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't initialize a standard bounty twice", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can send ETH to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await web3.eth.sendTransaction({from: accounts[0], to: newBounty.address, value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

  });

  it("Verifies that I can send tokens to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.transfer(newBounty.address, 100, {from: accounts[0]});

    let balance = await stdt.balanceOf(newBounty.address);

    assert(parseInt(balance, 10) === 100);


  });

  it("Verifies that I can send both ETH and tokens to a standard bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await web3.eth.sendTransaction({from: accounts[0], to: newBounty.address, value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.transfer(newBounty.address, 100, {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    assert(parseInt(tokenBalance, 10) === 100);


  });

  it("Verifies that I can refundableContribute to a standard bounty with ETH", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[1], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

  });

  it("Verifies that I can refundableContribute to a standard bounty with tokens", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await stdt.approve(newBounty.address, 100, {from: accounts[0]});

    await newBounty.refundableContribute([100], [stdt.address], {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    assert(parseInt(tokenBalance, 10) === 100);

  });

  it("Verifies that I can refundableContribute to a standard bounty with both ETH and tokens", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([1000, 100], [stdt.address, "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    let balance = await web3.eth.getBalance(newBounty.address);

    (parseInt(balance, 10) === 100);


  });

  it("Verifies that I can't refundableContribute to a standard bounty with the wrong token amounts", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    try {
      await newBounty.refundableContribute([10000], [stdt.address], {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with the wrong ETH amount", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    try {
      await newBounty.refundableContribute([10000], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with an amounts array length", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    try {
      await newBounty.refundableContribute([100, 1000, 100], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with  the same token twice", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    try {
      await newBounty.refundableContribute([1000, 1000], [stdt.address, stdt.address], {from: accounts[0]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with ETH twice", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    try {
      await newBounty.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 1000});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can refund a refundableContribute in ETH", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.refundContribution(0, {from: accounts[0]});

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);


  });

  it("Verifies that I can refund a refundableContribute in tokens", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([1000], [stdt.address], {from: accounts[0]});

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.refundContribution(0, {from: accounts[0]});

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can refund a refundableContribute in both tokens and ETH simultaneously", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([1000, 1000], [stdt.address, "0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 1000});

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 1000);

    await newBounty.refundContribution(0, {from: accounts[0]});

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 0);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);


  });

  it("Verifies that I can't refund a refundableContribute twice", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.refundContribution(0, {from: accounts[0]});

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);

    try {
      await newBounty.refundContribution(0, {from: accounts[0]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refund someone else's refundableContribute", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await newBounty.refundContribution(0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can't refund a refundableContribute that has already paid", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.fulfillBounty(accounts[2], "data");

    await newBounty.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000"]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);

    try {
      await newBounty.refundContribution(0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can fulfill a bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.fulfillBounty(accounts[2], "data");

  });

  it("Verifies that I can't fulfill a bounty if I am the issuer", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await newBounty.fulfillBounty(accounts[0], "data");

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can update my fulfillment", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.updateFulfillment(0, "data2", {from: accounts[2]});

    fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data2");

  });

  it("Verifies that I can't update someone else's fulfillment", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await newBounty.updateFulfillment(0, "data2", {from: accounts[3]});

    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("Verifies that I can't update an out-of-bounds fulfillment", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await newBounty.updateFulfillment(1, "data2", {from: accounts[2]});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't update a fulfillment that has paid out", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    await newBounty.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000"]);


    try {
      await newBounty.updateFulfillment(0, "data2", {from: accounts[2]});

    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can accept a fulfillment paying out some tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000"]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);


  });

  it("Verifies that I can accept a fulfillment paying out all tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 0);


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of (only denomenator)", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.acceptFulfillment(0, 1, 2, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 500);

  });

  it("Verifies that I can't accept a fulfillment paying out more tokens than I have a balance of (only numerator)", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await newBounty.acceptFulfillment(0, 2, 1, ["0x0000000000000000000000000000000000000000", stdt.address]);
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of (both numerator and denomenator)", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.acceptFulfillment(0, 2, 3, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 34);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 334);

  });

  it("Verifies that I can't accept a fulfillment paying out in tokens I don't have a balance of", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    let stdt2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await newBounty.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address, stdt2.address]);
    } catch (error){
      return utils.ensureException(error);

    }

  });

  it("Verifies that I can accept several fulfillments paying equal fractions", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 1000});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 1000);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data1");
    await newBounty.fulfillBounty(accounts[3], "data2");
    await newBounty.fulfillBounty(accounts[4], "data3");
    await newBounty.fulfillBounty(accounts[5], "data4");

    await newBounty.acceptFulfillment(0, 1, 4, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0]});

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 750);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 750);

    await newBounty.acceptFulfillment(1, 1, 3, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0]});

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 500);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 500);

    await newBounty.acceptFulfillment(2, 1, 2, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0]});

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 250);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 250);

    await newBounty.acceptFulfillment(3, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0]});

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 0);

  });


  it("Verifies that I can't accept a fulfillment if I'm not an issuer", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    try {
      await newBounty.acceptFulfillment(0, 1, 1, ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can drain my own bounty before a payout", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can drain my own bounty after a payout", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    await newBounty.fulfillBounty(accounts[2], "data");

    let fulfillment = await newBounty.getFulfillment(0);

    assert(fulfillment[1] === "data");

    await newBounty.acceptFulfillment(0, 1, 2, ["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 500);

    await newBounty.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can't drain someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(newBounty.address, 1000);

    await newBounty.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[0], value: 100});

    let balance = await web3.eth.getBalance(newBounty.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(newBounty.address);

    (parseInt(tokenBalance, 10) === 1000);

    try {
      await newBounty.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    await newBounty.changeBounty(accounts[4], "deebdaedx0", {from: accounts[0]});

    bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === "deebdaedx0");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await newBounty.changeBounty(accounts[4], "deebdaedx0", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("Verifies that I can change my own bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    await newBounty.changeController(accounts[4], {from: accounts[0]});

    bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await newBounty.changeController(accounts[4], {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty's data", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    await newBounty.changeData("newData", {from: accounts[0]});

    bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "newData");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);


  });

  it("Verifies that I can't change someone else's bounty's data", async () => {

    let stdb = await StandardBounty.new();

    let stdbProxy = await Proxy.new(stdb.address);

    let newBounty = StandardBounty.at(stdbProxy.address);

    await newBounty.initializeBounty(accounts[0], "0xdeadbeef", {from: accounts[0]});

    let bounty = await newBounty.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === "0xdeadbeef");
    assert(bounty[2] === false);
    assert(parseInt(bounty[3], 10) === 0);

    try {
      await newBounty.changeData("newData", {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

});
