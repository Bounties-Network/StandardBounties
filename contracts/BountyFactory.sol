pragma solidity ^0.4.11;

import "./Factory.sol";
import "./StandardBounty.sol";


/// @title Code bug bounties factory, concept by Stefan George - <stefan.george@consensys.net>
/// @author Gonçalo Sá <goncalo.sa@consensys.net>
contract BountyFactory is Factory {
    address[] public instances;


    /// @dev Allows multiple creations of bounties
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _contactInfo a string with contact info of the issuer, for them to be contacted if needed
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
    /// @param _numMilestones the total number of milestones which can be paid out
    /// @param _arbiter the address of the arbiter who can mediate claims
    function create(
      uint _deadline,
      string _contactInfo,
      string _data,
      uint[] _fulfillmentAmounts,
      uint _numMilestones,
      address _arbiter
    )
        public
        returns (address bounty)
    {
        bounty = new StandardBounty(
          _deadline,
          _contactInfo,
          _data,
          _fulfillmentAmounts,
          _numMilestones,
          _arbiter
        );
        instances.push(bounty);
        register(bounty);
    }

}
