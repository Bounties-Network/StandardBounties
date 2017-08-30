pragma solidity ^0.4.11;

import "./inherited/Factory.sol";
import "./StandardBounty.sol";


/// @title Code bug bounties factory, concept by Stefan George - <stefan.george@consensys.net>
/// @author Gonçalo Sá <goncalo.sa@consensys.net>
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
      uint _totalFulfillmentAmounts,
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
          _totalFulfillmentAmounts,
          _numMilestones,
          _arbiter
        );
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
     isInstantiation[_bountyAddress] = false;
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
