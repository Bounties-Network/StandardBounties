const StandardBounties = artifacts.require("../contracts/StandardBounties");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");
const BountiesMetaTxRelayer = artifacts.require("../contracts/BountiesMetaTxRelayer");

const utils = require("./helpers/Utils");

const BN = require("bignumber.js");

contract("BountiesMetaTxRelayer", function(accounts) {
  it("[ETH][META] Verifies that the Meta Txn Relayer deployment works", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();
    assert(registryOwner === accounts[0], "Registry owner is not specified account");

    await registry.setMetaTxRelayer(relayer.address);
    const registryRelayerAddress = await registry.metaTxRelayer.call();

    assert(registryRelayerAddress === relayer.address, "Relayer addresss does not get set correctly");
  });

  it("[ETH][META] Verifies that only the owner of the registry can set the meta txn relayer", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    try {
      await registry.setMetaTxRelayer(relayer.address, { from: accounts[1] });
    } catch (error) {
      return utils.ensureException(error);
    }
    assert(false, "Error thrown because only the owner of the registry should be able to set the meta txn relayer");
  });

  it("[ETH][META] Verifies that the owner of the registry can't change the relayer more than once", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    try {
      await registry.setMetaTxRelayer(relayer.address);
    } catch (error) {
      return utils.ensureException(error);
    }
    assert(false, "Error thrown because the owner of the registry was able to set the relayer more than once");
  });

  it("[ETH][META] Verifies that a non-owner of the registry can't change the relayer", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    try {
      await registry.setMetaTxRelayer(relayer.address, { from: accounts[1] });
    } catch (error) {
      return utils.ensureException(error);
    }
    assert(false, "Error thrown because a non-owner of the registry was able to set the relayer");
  });

  it("[ETH][META] Verifies that I can issue a bounty", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    const latestNonce = await relayer.replayNonce.call(accounts[0]);

    const nonce = web3.utils.hexToNumber(latestNonce);

    const params = [
      ["address", "string", "address[]", "address[]", "string", "uint", "address", "uint", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaIssueBounty",
        [accounts[3]],
        [accounts[3]],
        "data",
        2528821098,
        "0x0000000000000000000000000000000000000000",
        0,
        nonce
      ]
    ];

    let paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));

    let signature = await web3.eth.sign(paramsHash, accounts[3]);


    await relayer.metaIssueBounty(
      signature,
      [accounts[3]],
      [accounts[3]],
      "data",
      2528821098,
      "0x0000000000000000000000000000000000000000",
      0,
      nonce,
      { from: accounts[2] }
    );

    const bounty = await registry.getBounty(0);
    assert(bounty != null, 'No bounty was created via the meta tx relayer')
    assert(bounty.issuers[0] == accounts[3], 'Bounty issuer not the same account who signed the meta tx')
  });

  it("[ETH][META] Verifies that I can issue a bounty and deposit funds", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    const latestNonce = await relayer.replayNonce.call(accounts[0]);

    const nonce = web3.utils.hexToNumber(latestNonce);

    const params = [
      ["address", "string", "address[]", "address[]", "string", "uint", "address", "uint", "uint", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaIssueAndContribute",
        [accounts[3]],
        [accounts[3]],
        "data",
        2528821098,
        "0x0000000000000000000000000000000000000000",
        0,
        1,
        nonce
      ]
    ];

    let paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));

    let signature = await web3.eth.sign(paramsHash, accounts[3]);


    await relayer.metaIssueAndContribute(
      signature,
      [accounts[3]],
      [accounts[3]],
      "data",
      2528821098,
      "0x0000000000000000000000000000000000000000",
      0,
      1,
      nonce,
      {value: 1,  from: accounts[2] }
    );

    const bounty = await registry.getBounty(0);
    assert(bounty != null, 'No bounty was created via the meta tx relayer');
    assert(bounty.issuers[0] == accounts[3], 'Bounty issuer not the same account who signed the meta tx');
    assert(bounty.balance == 1, 'Funds were not deposited');
  });

  it("[ETH][META] Verifies that I can fulfill a bounty", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    await registry.issueAndContribute(accounts[0], [accounts[0]], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1, from: accounts[0]});

    let latestNonce = await relayer.replayNonce.call(accounts[3]);
    // accounts[3] is the submitter, accounts[1] is the fulfiller, while accounts[2] actually submits the txn

    let nonce = web3.utils.hexToNumber(latestNonce);

    let params = [
      ["address", "string", "uint", "address[]", "string", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaFulfillBounty",
        0,
        [accounts[1]],
        "data",
        nonce
      ]
    ];

    let paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));

    let signature = await web3.eth.sign(paramsHash, accounts[3]);


    await relayer.metaFulfillBounty(
      signature,
      0,
      [accounts[1]],
      "data",
      nonce,
      { from: accounts[2] }
    );

    const bounty = await registry.getBounty(0);
    assert(bounty.fulfillments.length == 1);
    assert(bounty.fulfillments[0].fulfillers[0] == accounts[1]);
    assert(bounty.fulfillments[0].submitter == accounts[3]);
  });

  it("[ETH][META] Verifies that I can update a fulfillment", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    await registry.issueAndContribute(accounts[0], [accounts[0]], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1, from: accounts[0]});

    let latestNonce = await relayer.replayNonce.call(accounts[3]);
    // accounts[3] is the submitter, accounts[1] is the fulfiller, while accounts[2] actually submits the txn

    let nonce = web3.utils.hexToNumber(latestNonce);

    let params = [
      ["address", "string", "uint", "address[]", "string", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaFulfillBounty",
        0,
        [accounts[1]],
        "data",
        nonce
      ]
    ];

    let paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));

    let signature = await web3.eth.sign(paramsHash, accounts[3]);


    await relayer.metaFulfillBounty(
      signature,
      0,
      [accounts[1]],
      "data",
      nonce,
      { from: accounts[2] }
    );

    let bounty = await registry.getBounty(0);
    assert(bounty.fulfillments.length == 1);
    assert(bounty.fulfillments[0].fulfillers[0] == accounts[1]);
    assert(bounty.fulfillments[0].submitter == accounts[3]);


    let newNonce = await relayer.replayNonce.call(accounts[3]);
    // accounts[3] is the submitter, accounts[1] is the fulfiller, while accounts[2] actually submits the txn

    let newestNonce = web3.utils.hexToNumber(newNonce);

    assert(newestNonce - 1 == nonce, "nonce did not increment by 1");

    params = [
      ["address", "string", "uint", "uint", "address[]", "string", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaUpdateFulfillment",
        0,
        0,
        [accounts[4]],
        "data2",
        newestNonce
      ]
    ];

    paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));

    signature = await web3.eth.sign(paramsHash, accounts[3]);

    await relayer.metaUpdateFulfillment(
      signature,
      0,
      0,
      [accounts[4]],
      "data2",
      newestNonce,
      { from: accounts[2] }
    );

    bounty = await registry.getBounty(0);
    assert(bounty.fulfillments.length == 1);
    assert(bounty.fulfillments[0].fulfillers[0] == accounts[4]);
    assert(bounty.fulfillments[0].submitter == accounts[3]);
  });
  it("[ETH][META] Verifies that I can't call a meta txn function with the wrong nonce", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    await registry.issueAndContribute(accounts[0], [accounts[0]], [accounts[1], accounts[2]], "data", 2528821098, "0x0000000000000000000000000000000000000000", 0, 1, {value: 1, from: accounts[0]});

    let latestNonce = await relayer.replayNonce.call(accounts[3]);
    // accounts[3] is the submitter, accounts[1] is the fulfiller, while accounts[2] actually submits the txn

    let nonce = web3.utils.hexToNumber(latestNonce);

    let params = [
      ["address", "string", "uint", "address[]", "string", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaFulfillBounty",
        0,
        [accounts[1]],
        "data",
        nonce
      ]
    ];

    let paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));

    let signature = await web3.eth.sign(paramsHash, accounts[3]);


    await relayer.metaFulfillBounty(
      signature,
      0,
      [accounts[1]],
      "data",
      nonce,
      { from: accounts[2] }
    );

    let bounty = await registry.getBounty(0);
    assert(bounty.fulfillments.length == 1);
    assert(bounty.fulfillments[0].fulfillers[0] == accounts[1]);
    assert(bounty.fulfillments[0].submitter == accounts[3]);


    let newNonce = await relayer.replayNonce.call(accounts[3]);
    // accounts[3] is the submitter, accounts[1] is the fulfiller, while accounts[2] actually submits the txn

    let newestNonce = web3.utils.hexToNumber(newNonce);

    assert(newestNonce - 1 == nonce, "nonce did not increment by 1");

    params = [
      ["address", "string", "uint", "uint", "address[]", "string", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaUpdateFulfillment",
        0,
        0,
        [accounts[4]],
        "data2",
        nonce
      ]
    ];

    paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));

    signature = await web3.eth.sign(paramsHash, accounts[3]);

    try {
      await relayer.metaUpdateFulfillment(
        signature,
        0,
        0,
        [accounts[4]],
        "data2",
        nonce,
        { from: accounts[2] }
      );
    } catch (error) {
      return utils.ensureException(error);
    }
    assert(false, "Error thrown because an incorrect nonce was used and didn't throw");

  });

  it("[ETH][META] Verifies that I can't take advantage of the encodePacked function for issuing a bounty", async () => {
    let registry = await StandardBounties.new();

    let relayer = await BountiesMetaTxRelayer.new(registry.address);

    const registryOwner = await registry.owner.call();

    assert(registryOwner === accounts[0]);

    await registry.setMetaTxRelayer(relayer.address);

    let latestNonce = await relayer.replayNonce.call(accounts[3]);

    let nonce = web3.utils.hexToNumber(latestNonce);

    let params = [
      ["address", "string", "address[]", "address[]", "string", "uint", "address", "uint", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaIssueBounty",
        [accounts[3], accounts[4]],
        [accounts[3]],
        "data",
        2528821098,
        "0x0000000000000000000000000000000000000000",
        0,
        nonce
      ]
    ];

    let paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));
    let signature = await web3.eth.sign(paramsHash, accounts[3]);

    // Meta issue first bounty to increase replayNonce
    await relayer.metaIssueBounty(
      signature,
      [accounts[3], accounts[4]],
      [accounts[3]],
      "data",
      2528821098,
      "0x0000000000000000000000000000000000000000",
      0,
      nonce,
      { from: accounts[2] }
    );
    // Sign again with new nonce so that the frontrunned metaIssueBounty transaction recovered signer does not have an equal replayNonce
    // Expecting a revert due to `require(_nonce == replayNonce[signer]);`
    latestNonce = await relayer.replayNonce.call(accounts[3]);
    nonce = web3.utils.hexToNumber(latestNonce);

    let firstNonce = nonce;

    params = [
      ["address", "string", "address[]", "address[]", "string", "uint", "address", "uint", "uint"],
      [
        web3.utils.toChecksumAddress(relayer.address),
        "metaIssueBounty",
        [accounts[3], accounts[4]],
        [accounts[3]],
        "data",
        2528821098,
        "0x0000000000000000000000000000000000000000",
        0,
        nonce
      ]
    ];

    paramsHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(...params));
    signature = await web3.eth.sign(paramsHash, accounts[3]);
    try {
      await relayer.metaIssueBounty(
        signature,
        [accounts[3]],
        [accounts[4], accounts[3]],
        "data",
        2528821098,
        "0x0000000000000000000000000000000000000000",
        0,
        nonce,
        { from: accounts[2] }
      );

    } catch (error) {
      let nonceAfter = await relayer.replayNonce.call(accounts[3]);
      let lastNonce = web3.utils.hexToNumber(nonceAfter);

      assert(firstNonce == lastNonce); // Checks to ensure the nonce didn't increment

      return utils.ensureException(error);
    }
    assert(false, "Error thrown because I am able to use one param as another to take advantage of encodePacked");
  });
});
