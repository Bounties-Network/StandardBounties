pragma solidity ^0.4.11;
import "./Factory.sol";
import "./CodeBugBounty.sol";


/// @title Code bug bounties factory, concept by Stefan George - <stefan.george@consensys.net>
/// @author Gonçalo Sá <goncalo.sa@consensys.net>, Mark Beylin <mark.beylin@consensys.net>
contract CodeBugBountyFactory is Factory {

    address[] public instances;


    /// @dev Allows multiple creations of code bug bounties
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _data the requirements of the bounty
    /// @param _contactInfo the contact information of the issuer
    /// @param _fulfillmentAmount the amount of wei to be paid out for each successful fulfillment
    /// @param _bountiedContract the address of the contract to be bountied (with invariants check implemented)
    function create(
        uint _deadline,
        string _data,
        string _contactInfo,
        uint _fulfillmentAmount,
        Bountied _bountiedContract
    )
        public
        returns (address bugBounty)
    {
        bugBounty = new CodeBugBounty(
            _deadline,
            _data,
            _contactInfo,
            _fulfillmentAmount,
            _bountiedContract
        );
        require (bugBounty!= 0x0);
        register(bugBounty);
    }
    /// @dev Registers contract in factory registry.
    /// @param instantiation Address of contract instantiation.
    function register(address instantiation)
    {
        instances.push(instantiation);
        isInstantiation[instantiation] = true;
        instantiations[msg.sender].push(instantiation);
        ContractInstantiation(msg.sender, instantiation);
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
}
