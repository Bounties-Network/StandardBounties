pragma solidity ^0.4.8;

import "./StandardBounty.sol";


/// @title Bountied
/// @dev Contract to be tested and that should disburse the 
/// `fulfillmentAmount` if it is sees its invariant truths broken
/// @author Gonçalo Sá <goncalo.sa@consensys.net>
contract Bountied {
    /// @dev checkInvariant(): function definition of a function that
    /// returns a boolean of constant truths you wish to maintain in 
    /// this logical copy of your bountied contract
    function checkInvariant() returns(bool);

}


/// @title CodeBugBounty
/// @dev extension of StandardBounty to be used specifically for code bug bounties
/// Concept borrowed
/// @author Gonçalo Sá <goncalo.sa@consensys.net>
contract CodeBugBounty is StandardBounty {

	/*
     * Storage
     */

    Bountied public bountiedContract;

	/*
     * Modifiers
     */

    modifier checkBountiedInvariants(address _bountiedContract) {
        if (_bountiedContract.checkInvariant()) {
            throw;
        }
    }

	/*
     * Public functions
     */

    /// @dev CodeBugBounty(): instantiates a new draft code bug bounty, activating it if sufficient funds exist to pay out the bounty
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmount the amount of wei to be paid out for each successful fulfillment
    /// @param _bountiedContract the address of the contract to be bountied (with invariants check implemented)
    function CodeBugBounty(
        uint _deadline,
        string _data,
        uint _fulfillmentAmount,
        Bountied _bountiedContract
    )
    	StandardBounty(
    		_deadline,
        	_data,
        	_fulfillmentAmount,
        	false
    	)
    	checkBountiedInvariants(_bountiedContract)
    {
        bountiedContract = _bountiedContract;
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds [OVERWRITTEN FROM StandardBounty]
    /// @param fulNum the index of the fulfillment being accepted
    function acceptFulfillment(uint fulNum)
        public
        isAtStage(BountyStages.Active)
        validateFulfillmentArrayIndex(fulNum)
        checkBountiedInvariants(bountiedContract)
    {
        fulfillments[fulNum].accepted = true;
        accepted[numAccepted] = fulNum;
        numAccepted ++;

        FulfillmentAccepted(msg.sender, fulfillmentAmount);
    }

}