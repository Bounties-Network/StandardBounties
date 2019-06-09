var StandardBounties = artifacts.require("../contacts/StandardBounties.sol");

module.exports = function(deployer) {
  deployer.deploy(StandardBounties, "0x0000000000000000000000000000000000000000");
};
