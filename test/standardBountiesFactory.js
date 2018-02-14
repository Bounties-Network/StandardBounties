const StandardBounty = artifacts.require("../contracts/StandardBounty");
const StandardBountiesFactory = artifacts.require("../contracts/StandardBountiesFactory");

const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");

const utils = require('./helpers/Utils');


contract('StandardBountiesFactory', function(accounts) {


  it("Verifies that I can deploy a standard bounties factory correctly", async () => {

    let stdb = await StandardBounty.new();

    let factory = await StandardBountiesFactory.new(stdb.address);

    for (var i = 0; i < 100; i++){
      await factory.createBounty(accounts[0], "data"+i);

      let bountyAddress = await factory.bounties(i);

      let bounty = await StandardBounty.at(bountyAddress);

      let controller = await bounty.controller();
      let data = await bounty.data();

      assert(controller == accounts[0]);
      assert(data == "data"+i);

      let total = await factory.getNumBounties();
      assert(parseInt(total, 10) == 1+i);
    }

  });


});
