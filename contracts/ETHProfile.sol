pragma solidity ^0.4.19;
contract ETHProfile {
    event profileUpdated(address user, string _profile);
    function addProfile(string _profile){
      profileUpdated(msg.sender, _profile);
    }
}
