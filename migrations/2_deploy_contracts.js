var StandardBounties = artifacts.require("../contacts/StandardBounties.sol");

module.exports = function(deployer) {
  console.log("deploying");
  deployer.deploy(StandardBounties);
};
