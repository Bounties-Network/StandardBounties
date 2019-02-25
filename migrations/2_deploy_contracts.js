var StandardBounties = artifacts.require("../contacts/StandardBounties.sol");

module.exports = function(deployer) {
  deployer.deploy(StandardBounties);
};
