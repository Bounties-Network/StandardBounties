pragma solidity ^0.4.11;

contract ApproveAndCallFallBack {
    function receiveApproval(address _from, uint256 _amount, address _token, bytes _data) external;
}
