var StandardBounties = artifacts.require("../contracts/StandardBounties.sol");

module.exports = function(deployer) {
  deployer.deploy(StandardBounties);
};
