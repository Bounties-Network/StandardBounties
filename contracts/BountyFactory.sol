pragma solidity ^0.4.11;

import "./inherited/Factory.sol";
import "./StandardBounty.sol";
import "./TokenBounty.sol";



/// @title Bounties factory, concept by Stefan George - <stefan.george@consensys.net>
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract BountyFactory is Factory {
    address[] public instances;
    address public owner;

    modifier onlyOwner(){
      require(msg.sender == owner);
      _;
    }

    modifier correctId(uint _bountyId, address _bountyAddress){
      require(instances[_bountyId] == _bountyAddress);
      _;
    }

    modifier correctUser(uint _userId, address _userAddress, address _bountyAddress){
      require(instantiations[_userAddress][_userId] == _bountyAddress);
      _;
    }

    /// @dev constructor for the factory
    function BountyFactory(){
      owner = msg.sender;
    }

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
    {
    address bounty;
      if (_tokenContract != address(0)){
        bounty = new StandardBounty(
          _deadline,
          _data,
          _fulfillmentAmounts,
          _totalFulfillmentAmounts,
          _arbiter
        );
      } else {
        bounty = new TokenBounty(
          _deadline,
          _data,
          _fulfillmentAmounts,
          _totalFulfillmentAmounts,
          _arbiter,
          _tokenContract
        );
      }
        instances.push(bounty);
        register(bounty);
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

   /// @dev Enables the creator of the factory to remove unwanted bounties
   /// @param _bountyId the ID of the bounty
   /// @param _bountyAddress the address of the bounty
   /// @param _userId the index of the bounty in the user's array
   /// @param _userAddress the address of the original bounty
   function remove(uint _bountyId, address _bountyAddress, uint _userId, address _userAddress)
   public
   onlyOwner
   correctId(_bountyId, _bountyAddress)
   correctUser(_userId, _userAddress, _bountyAddress)
   {
     delete instances[_bountyId];
     delete instantiations[_userAddress][_userId];

   }

   /// @dev Enables the creator of the factory transfer ownership
   /// @param _newOwner the new address of the owner
   function transferOwner(address _newOwner)
   public
   onlyOwner
   {
     owner = _newOwner;
   }
}
