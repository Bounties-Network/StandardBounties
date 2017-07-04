var CodeBugBountyFactory = artifacts.require("./CodeBugBountyFactory.sol");

module.exports = function(deployer) {
  deployer.deploy(CodeBugBountyFactory);
};
