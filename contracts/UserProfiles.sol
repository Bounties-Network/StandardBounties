pragma solidity 0.4.18;


/// @title User Profiles
/// @author Mark Beylin <mark.beylin@consensys.net>

contract UserProfiles {
  event ProfileUpdated(string _data, address _user);

  mapping (address => string) profiles;


  function updateProfile(string _newData) public{
    profiles[msg.sender] = _newData;
  }

  function getProfile(address _user) public constant returns (string) {
    return profiles[_user];
  }

}
