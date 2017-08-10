pragma solidity ^0.4.13;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/StandardBounty.sol";

contract TestStandardBounty {

  function testNewStandardBounty() {
    uint256[] fulfillmentAmounts;
    fulfillmentAmounts.push(1000);
    fulfillmentAmounts.push(1000);
    fulfillmentAmounts.push(1000);

    StandardBounty newBounty = new StandardBounty(1602313898,
                                                  "",
                                                  "",
                                                  fulfillmentAmounts,
                                                  3,
                                                   0x0);


    assert(newBounty.bountyStage() == StandardBounty.BountyStages.Draft);
  }

}
