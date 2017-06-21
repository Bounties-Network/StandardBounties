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
    /// @param _fulfillmentAmount the amount of wei to be paid out for each successful fulfillment
    function create(
        uint _deadline,
        string _contactInfo,
        string _data,
        uint _fulfillmentAmount

    )
        public
        returns (address bounty)
    {
        bounty = new StandardBounty(
          _deadline,
          _contactInfo,
          _data,
          _fulfillmentAmount
        );
        register(bounty);
    }

}
