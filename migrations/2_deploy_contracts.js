var StandardBounty = artifacts.require("../contacts/StandardBounty.sol");

module.exports = function(deployer) {
  deployer.deploy(StandardBounty);
};
