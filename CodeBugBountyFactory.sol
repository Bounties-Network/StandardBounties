pragma solidity ^0.4.8;
import "./Factory.sol";
import "./CodeBugBounty.sol";


/// @title Code bug bounties factory, concept by Stefan George - <stefan.george@consensys.net>
/// @author Gonçalo Sá <goncalo.sa@consensys.net>
contract CodeBugBountyFactory is Factory {

    /// @dev Allows multiple creations of code bug bounties
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmount the amount of wei to be paid out for each successful fulfillment
    /// @param _bountiedContract the address of the contract to be bountied (with invariants check implemented)
    function create(
        uint _deadline,
        string _data,
        uint _fulfillmentAmount,
        Bountied _bountiedContract
    )
        public
        returns (address bugBounty)
    {
        bugBounty = new CodeBugBounty(
            _deadline,
            _data,
            _fulfillmentAmount,
            _bountiedContract
        );
        register(bugBounty);
    }
}
