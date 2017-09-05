pragma solidity ^0.4.11;

import "./TokenBounty.sol";


/// @title Token Bounty factory,
/// @author Mark Beylin <mark.beylin@consensys.net>
contract TokenBountyFactory{

    /// @dev Allows multiple creations of bounties
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
    /// @param _arbiter the address of the arbiter who can mediate claims
    /// @param _tokenContract if the bounty pays out in tokens, the address of the token contract

    function create(
      uint _deadline,
      string _data,
      uint[] _fulfillmentAmounts,
      uint _totalFulfillmentAmounts,
      address _arbiter,
      address _tokenContract
    )
        public
        returns (address bounty)
    {
        bounty = new TokenBounty(
          _deadline,
          _data,
          _fulfillmentAmounts,
          _totalFulfillmentAmounts,
          _arbiter,
          _tokenContract
        );
    }
}
