pragma solidity ^0.4.11;



/// @title Bountied
/// @dev Contract to be tested and that should disburse the
/// `fulfillmentAmount` if it is sees its invariant truths broken
/// @author Gonçalo Sá <goncalo.sa@consensys.net>, Mark Beylin <mark.beylin@consensys.net>
contract Bountied {
    /// @dev checkInvariant(): function definition of a function that
    /// returns a boolean of constant truths you wish to maintain in
    /// this logical copy of your bountied contract
    function checkInvariant() returns(bool){
        return (true);
    }

}
