pragma solidity ^0.4.13;
import "./StandardBounty.sol";
import "./Bountied.sol";



/// @title CodeBugBounty
/// @dev extension of StandardBounty to be used specifically for code bug bounties
/// Concept borrowed
/// @author Gonçalo Sá <goncalo.sa@consensys.net>, Mark Beylin <mark.beylin@consensys.net>
contract CodeBugBounty is StandardBounty {

  /*
  * Storage
  */

  Bountied public bountiedContract;

  /*
  * Modifiers
  */

  modifier checkBountiedInvariants(address _bountiedContract) {
    Bountied newBountiedContract = Bountied(_bountiedContract);
    require(newBountiedContract.checkInvariant());
    _;
  }

  modifier checkBountiedInvariantsFailed(uint _milestoneId) {
    require((_milestoneId != 0) || !bountiedContract.checkInvariant());
    _;
  }

  /*
  * Public functions
  */

  /// @dev CodeBugBounty(): instantiates a new draft code bug bounty
  /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
  /// @param _contactInfo the contact information of the issuer
  /// @param _data the requirements of the bounty
  /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
  /// @param _bountiedContract the address of the contract to be bountied (with invariants check implemented)
  /// @param _numMilestones the total number of milestones which can be paid out
  /// @param _arbiter the address of the arbiter who can mediate claims

  function CodeBugBounty(
    uint _deadline,
    string _contactInfo,
    string _data,
    uint[] _fulfillmentAmounts,
    uint _numMilestones,
    address _arbiter,
    Bountied _bountiedContract
    )
    StandardBounty(
      _deadline,
      _contactInfo,
      _data,
      _fulfillmentAmounts,
      _numMilestones,
      _arbiter
      )
    checkBountiedInvariants(_bountiedContract)
  {
    bountiedContract = _bountiedContract;
  }

  /// @dev fulfillBounty(): submit a fulfillment for the given bounty. If the
  /// milestone is 0, the contract checks if the invariants of the contract were
  /// broken.
  /// @param _data the data artifacts representing the fulfillment of the bounty
  /// @param _dataType a meaningful description of the type of data the fulfillment represents
  /// @param _milestoneId the id of the milestone being fulfilled
  function fulfillBounty(string _data, string _dataType, uint _milestoneId)
  public
  isAtStage(BountyStages.Active)
  isBeforeDeadline
  checkFulfillmentsNumber(_milestoneId)
  notIssuerOrArbiter
  checkBountiedInvariantsFailed(_milestoneId)
  {
    fulfillments[_milestoneId].push(Fulfillment(false, false, msg.sender, _data, _dataType));

    BountyFulfilled(msg.sender, numFulfillments[_milestoneId]++, _milestoneId);
  }

}
