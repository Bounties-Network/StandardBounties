const StandardBounty = artifacts.require("../contracts/StandardBounty");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");
const ERC721BasicTokenMock = artifacts.require("../contracts/inherited/ERC721BasicTokenMock");

const utils = require('./helpers/Utils');

const BN = require('bignumber.js');

const { providers, Contract } = require('ethers');
const stdbAbi = require('../build/contracts/StandardBounty.json');
const web3Provider = new providers.Web3Provider(web3.currentProvider);




contract('StandardBounty', function(accounts) {


  it("Verifies that I can deploy a standard bounty", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

  });

  it("Verifies that I can initialize a standard bounty", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);


  });

  it("Verifies that I can't initialize a standard bounty with the 0 address", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    try {
      await stdbWrapper.initializeBounty("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0xdeadbeef", "1800000000");

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't initialize a standard bounty twice", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    try {
      await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can send ETH to a standard bounty", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    await web3.eth.sendTransaction({from: accounts[0], to: stdbWrapper.address, value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

  });

  it("Verifies that I can send tokens to a standard bounty", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.transfer(stdbWrapper.address, 100);

    let balance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);


  });

  it("Verifies that I can send both ETH and tokens to a standard bounty", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    await web3.eth.sendTransaction({ from: accounts[0], to: stdb.address, value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.transfer(stdbWrapper.address, 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 100);


  });

  it("Verifies that I can refundableContribute to a standard bounty with ETH", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], [0], {from: accounts[1], value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let contribution = await stdb.getContribution(0);

    assert(contribution[0] === accounts[1]);
    assert(parseInt(contribution[1],10) === 100);
    assert(contribution[2][0] === "0x0000000000000000000000000000000000000000");
    assert(parseInt(contribution[3][0], 10) === 0);
    assert(contribution[4] === false);

  });

  it("Verifies that I can refundableContribute to a standard bounty with tokens", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 100);

    await stdb.refundableContribute([100], [stdt.address], [20]);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 100);

    let contribution = await stdb.getContribution(0);

    assert(contribution[0] === accounts[0]);
    assert(parseInt(contribution[1],10) === 100);
    assert(contribution[2][0] === stdt.address);
    assert(parseInt(contribution[3][0], 10) === 20);
    assert(contribution[4] === false);

  });

  it("Verifies that I can refundableContribute to a standard bounty with both ETH and tokens", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdb.refundableContribute([1000, 100], [stdt.address, "0x0000000000000000000000000000000000000000"], [20, 0], {value: 100});

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    (parseInt(balance, 10) === 100);


  });

  it("Verifies that I can't refundableContribute to a standard bounty with the wrong token amounts", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    try {
      await stdbWrapper.refundableContribute([10000], [stdt.address], [20]);

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with the wrong ETH amount", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    try {
      await stdb.refundableContribute([10000], ["0x0000000000000000000000000000000000000000"], [0], {value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with an incorrect amounts array length", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    try {
      await stdb.refundableContribute([100, 1000, 100], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with an incorrect token versions array length", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    try {
      await stdb.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20, 0], {value: 100});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with the same token twice", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    try {
      await stdb.refundableContribute([1000, 1000], [stdt.address, stdt.address], [20, 20]);

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refundableContribute to a standard bounty with ETH twice", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    try {
      await stdb.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"], [0, 0], {value: 1000});

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can refund a refundableContribute in ETH", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    var blockNumber = await web3.eth.blockNumber;

    var timestamp = await web3.eth.getBlock(blockNumber).timestamp;

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", parseInt(timestamp, 10) - 10 );

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], [0], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    await stdbWrapper.refundContribution(0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);


  });

  it("Verifies that I can refund a refundableContribute in tokens", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    var blockNumber = web3.eth.blockNumber;

    var timestamp = web3.eth.getBlock(blockNumber).timestamp;

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", parseInt(timestamp, 10) - 10);

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdb.refundableContribute([1000], [stdt.address], [20]);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.refundContribution(0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can refund a refundableContribute in both tokens and ETH simultaneously", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    var blockNumber = web3.eth.blockNumber;

    var timestamp = web3.eth.getBlock(blockNumber).timestamp;

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", parseInt(timestamp, 10) - 10);

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdb.refundableContribute([1000, 1000], [stdt.address, "0x0000000000000000000000000000000000000000"], [20, 0], {value: 1000});

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 1000);

    await stdbWrapper.refundContribution(0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);


  });

  it("Verifies that I can't refund a refundableContribute twice", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    var blockNumber = web3.eth.blockNumber;

    var timestamp = web3.eth.getBlock(blockNumber).timestamp;

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", parseInt(timestamp, 10) - 10);

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], [0], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    await stdbWrapper.refundContribution(0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    try {
      await stdbWrapper.refundContribution(0);
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't refund someone else's refundableContribute", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    var blockNumber = web3.eth.blockNumber;

    var timestamp = web3.eth.getBlock(blockNumber).timestamp;

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", parseInt(timestamp, 10) - 10);

    await stdb.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], [0], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await stdb.refundContribution(0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }


  });
/*
  it("Verifies that I can't refund a refundableContribute that has already paid", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    var blockNumber = web3.eth.blockNumber;

    var timestamp = web3.eth.getBlock(blockNumber).timestamp;

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", parseInt(timestamp, 10) + 200);

    await stdbWrapper.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], [0], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000"], [0], [[100]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    await stdbWrapper.changeDeadline(parseInt(timestamp, 10) - 200);

    try {
      await stdb.refundContribution(0, {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }

  });
/*
  it("Verifies that I can submit my intention to fulfill a bounty", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    await stdbWrapper.submitIntention().then((status) => {
      assert.strictEqual('IntentionSubmitted', status.logs[0].event, 'did not emit the IntentionSubmitted event');
    });

  });

  it("Verifies that I can fulfill a bounty", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    await stdbWrapper.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], [0], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

  });

  it("Verifies that I can't fulfill a bounty if I am the issuer", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    await stdbWrapper.refundableContribute([100], ["0x0000000000000000000000000000000000000000"], [0], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    try {
      await stdbWrapper.fulfillBounty([accounts[0]], "data");

    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can accept a fulfillment paying out some ERC721 tokens I have a balance of", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await ERC721BasicTokenMock.new();

    await stdt.mint(accounts[0], 123);

    let owner = await stdt.ownerOf(123);

    assert(owner === accounts[0]);

    await stdt.approve(stdbWrapper.address, 123);

    await stdbWrapper.refundableContribute([123], [stdt.address], [721]);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1);

    owner = await stdt.ownerOf(123);

    assert(owner === stdbWrapper.address);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    await stdbWrapper.acceptFulfillment(0, [stdt.address], [721], [[123]]);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 0);

    owner = await stdt.ownerOf(123);

    assert(owner === accounts[2]);


  });

  it("Verifies that I can accept a fulfillment paying out some tokens I have a balance of", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000"], [0], [[100]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);


  });

  it("Verifies that I can accept a fulfillment paying out all tokens I have a balance of", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[100], [1000]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);


  });

  it("Verifies that the arbiter can accept a fulfillment", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[100], [1000]], {from: accounts[1]});

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of (only denomenator)", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[50], [500]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 500);

  });

  it("Verifies that I can't accept a fulfillment paying out more tokens than I have a balance of", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    try {
      await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[110], [1000]]);
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can accept a fulfillment paying out a fraction of the tokens I have a balance of", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[66], [666]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 34);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 334);

  });

  it("Verifies that I can't accept a fulfillment paying out in tokens I don't have a balance of", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    let stdt2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    let tokenBalance2 = await stdt2.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance2, 10) === 0);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    try {
      await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address, stdt2.address], [0, 20, 20], [[100], [1000], [1000]]);
    } catch (error){
      return utils.ensureException(error);

    }

  });

  it("Verifies that I can accept several fulfillments paying equal fractions", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 1000});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 1000);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data1");
    await stdbWrapper.fulfillBounty([accounts[3]], "data2");
    await stdbWrapper.fulfillBounty([accounts[4]], "data3");
    await stdbWrapper.fulfillBounty([accounts[5]], "data4");

    await stdbWrapper.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[250], [250]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 750);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 750);

    await stdbWrapper.acceptFulfillment(1, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[250], [250]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 500);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 500);

    await stdbWrapper.acceptFulfillment(2, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[250], [250]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 250);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 250);

    await stdbWrapper.acceptFulfillment(3, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[250], [250]]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);

  });


  it("Verifies that I can't accept a fulfillment if I'm not an issuer", async () => {

    const stdb = await StandardBounty.new();
    const stdbWrapper = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[0]));
    const stdbWrapper3 = new Contract(stdb.address, stdbAbi.abi, web3Provider.getSigner(accounts[3]));


    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdbWrapper.fulfillBounty([accounts[2]], "data");

    let fulfillment = await stdbWrapper.getFulfillment(0);

    try {
      await stdbWrapper3.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [0, 20], [[100],[1000]], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });
/*
  it("Verifies that I can drain my own bounty before a payout", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can drain my own bounty after a payout", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillBounty([accounts[2]], [1], 1, "data");

    let fulfillment = await stdb.getFulfillment(0);

    await stdb.acceptFulfillment(0, ["0x0000000000000000000000000000000000000000", stdt.address], [50, 500]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 500);

    await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);

  });

  it("Verifies that I can fulfill and accept paying out all tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [100, 1000]);

    let fulfillment = await stdb.getFulfillment(0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);

  });
  it("Verifies that I can accept a fulfillment paying out some tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data",["0x0000000000000000000000000000000000000000"], [100]);

    let fulfillment = await stdb.getFulfillment(0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);


  });

  it("Verifies that I can fulfill and accept a fulfillment paying out all tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [100, 1000]);

    let fulfillment = await stdb.getFulfillment(0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);


  });

  it("Verifies that I can fulfill and accept a fulfillment paying out a fraction of the tokens I have a balance of (only denomenator)", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [50, 500]);

    let fulfillment = await stdb.getFulfillment(0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 50);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 500);

  });

  it("Verifies that I can't fulfill and accept a fulfillment paying out more tokens than I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    try {
      await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data",["0x0000000000000000000000000000000000000000", stdt.address], [110, 1000]);
    } catch (error){
      return utils.ensureException(error);
    }


  });

  it("Verifies that I can fulfill and accept a fulfillment paying out a fraction of the tokens I have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data",["0x0000000000000000000000000000000000000000", stdt.address], [66, 666]);

    let fulfillment = await stdb.getFulfillment(0);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 34);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 334);

  });

  it("Verifies that I can't fulfill and accept a fulfillment paying out in tokens I don't have a balance of", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");
    let stdt2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    let tokenBalance2 = await stdt2.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance2, 10) === 0);

    try {
      await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address, stdt2.address], [100, 1000, 1000]);
    } catch (error){
      return utils.ensureException(error);

    }

  });

  it("Verifies that I can fulfill and accept several fulfillments paying equal fractions", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([1000, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 1000});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 1000);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data1", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 750);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 750);

    await stdb.fulfillAndAccept([accounts[3]], [1], 1, "data2", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);


    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 500);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 500);

    await stdb.fulfillAndAccept([accounts[4]], [1], 1, "data3", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 250);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 250);

    await stdb.fulfillAndAccept([accounts[5]], [1], 1, "data4", ["0x0000000000000000000000000000000000000000", stdt.address], [250, 250]);

    balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 0);

    tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    (parseInt(tokenBalance, 10) === 0);

  });


  it("Verifies that I can't fulfill and accept if I'm not an issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    try {
      await stdb.fulfillAndAccept([accounts[2]], [1], 1, "data", ["0x0000000000000000000000000000000000000000", stdt.address], [100,1000], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can't drain someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let stdt = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT");

    await stdt.approve(stdbWrapper.address, 1000);

    await stdbWrapper.refundableContribute([100, 1000], ["0x0000000000000000000000000000000000000000", stdt.address], {value: 100});

    let balance = await web3.eth.getBalance(stdbWrapper.address);

    assert(parseInt(balance, 10) === 100);

    let tokenBalance = await stdt.balanceOf(stdbWrapper.address);

    assert(parseInt(tokenBalance, 10) === 1000);

    try {
      await stdb.drainBounty(["0x0000000000000000000000000000000000000000", stdt.address], {from: accounts[3]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    await stdb.changeBounty(accounts[4], accounts[5], "deebdaedx0", "19191919191919");

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    try {
      await stdb.changeBounty(accounts[4], accounts[5], "deebdaedx0", "19191919191919", {from: accounts[1]});
    } catch (error){
      return utils.ensureException(error);
    }
  });

  it("Verifies that I can change my own bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    await stdb.changeController(accounts[4]);

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[4]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty's issuer", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    try {
      await stdb.changeController(accounts[4], {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty's arbiter", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[4] === accounts[1]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    await stdb.changeArbiter(accounts[4]);

    bounty = await stdb.getBounty();

    assert(bounty[4] === accounts[4]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

  });

  it("Verifies that I can't change someone else's bounty's arbiter", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[4] === accounts[1]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    try {
      await stdb.changeArbiter(accounts[4], {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });

  it("Verifies that I can change my own bounty's data", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    await stdb.changeData("newData");

    bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);


  });

  it("Verifies that I can't change someone else's bounty's data", async () => {

    let stdb = await StandardBounty.new();

    await stdbWrapper.initializeBounty(accounts[0], accounts[1], "0xdeadbeef", "1800000000");

    let bounty = await stdb.getBounty();

    assert(bounty[0] === accounts[0]);
    assert(bounty[1] === false);
    assert(parseInt(bounty[2], 10) === 0);

    try {
      await stdb.changeData("newData", {from: accounts[2]});
    } catch (error){
      return utils.ensureException(error);
    }

  });
*/
});
