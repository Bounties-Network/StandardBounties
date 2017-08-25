pragma solidity ^0.4.11;
import "./inherited/Factory.sol";
import "./CodeBugBounty.sol";


/// @title Code bug bounties factory, concept by Stefan George - <stefan.george@consensys.net>
/// @author Gonçalo Sá <goncalo.sa@consensys.net>, Mark Beylin <mark.beylin@consensys.net>
contract CodeBugBountyFactory is Factory {

    address[] public instances;


    /// @dev Allows multiple creations of code bug bounties
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _contactInfo the contact information of the issuer
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
    /// @param _bountiedContract the address of the contract to be bountied (with invariants check implemented)
    /// @param _numMilestones the total number of milestones which can be paid out
    /// @param _arbiter the address of the arbiter who can mediate claims
    function create(
      uint _deadline,
      string _contactInfo,
      string _data,
      uint[] _fulfillmentAmounts,
      uint _totalFulfillmentAmounts,
      uint _numMilestones,
      address _arbiter,
      Bountied _bountiedContract
    )
        public
        returns (address bugBounty)
    {
        bugBounty = new CodeBugBounty(
            _deadline,
            _contactInfo,
            _data,
            _fulfillmentAmounts,
            _totalFulfillmentAmounts,
            _numMilestones,
            _arbiter,
            _bountiedContract
        );
        instances.push(bugBounty);
        register(bugBounty);
    }

     /// @dev Returns number of instances
    /// @return Returns number of instantiations by creator.
    function getInstanceCount()
        public
        constant
        returns (uint)
    {
        return instances.length;

    }
}
