var StandardBounties = artifacts.require("../contracts/StandardBounties.sol");

module.exports = function(deployer) {
  deployer.deploy(StandardBounties, "0x0000000000000000000000000000000000000000");
};
