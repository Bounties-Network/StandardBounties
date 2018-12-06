var StandardBounty = artifacts.require("../contacts/StandardBounty.sol");
var StandardBountyFactory = artifacts.require("../contracts/StandardBountiesFactory.sol");

module.exports = async function(deployer) {
  const address = await deployer.deploy(StandardBounty);
  deployer.deploy(StandardBountyFactory(address))
};
