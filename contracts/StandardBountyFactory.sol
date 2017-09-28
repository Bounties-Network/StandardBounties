pragma solidity ^0.4.11;

import "./StandardBounty.sol";


/// @title Standard Bounty factory,
/// @author Mark Beylin <mark.beylin@consensys.net>
contract StandardBountyFactory{

    /// @dev Allows for the creation of bounties
    /// @param _issuer the address of the intended issuer of the bounty
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
    /// @param _totalFulfillmentAmounts the sum of the individual fulfillment amounts
    /// @param _arbiter the address of the arbiter who can mediate claims
    function create(
      address _issuer,
      uint _deadline,
      string _data,
      uint[] _fulfillmentAmounts,
      uint _totalFulfillmentAmounts,
      address _arbiter
    )
        public
        returns (address bounty)
    {
        bounty = new StandardBounty(
          _issuer,
          _deadline,
          _data,
          _fulfillmentAmounts,
          _totalFulfillmentAmounts,
          _arbiter
        );
    }


}
