pragma solidity ^0.4.11;
import "./StandardBounty.sol";
import "./Bountied.sol";



/// @title CodeBugBounty
/// @dev extension of StandardBounty to be used specifically for code bug bounties
/// Concept borrowed
/// @author Gonçalo Sá <goncalo.sa@consensys.net>, Mark Beylin <mark.beylin@consensys.net>
contract CodeBugBounty is StandardBounty {

	/*
     * Storage
     */

    Bountied public bountiedContract;

	/*
     * Modifiers
     */

    modifier checkBountiedInvariants(address _bountiedContract) {
        Bountied newBountiedContract = Bountied(_bountiedContract);
        require(newBountiedContract.checkInvariant());
        _;
    }

    modifier checkBountiedInvariantsFailed() {
        require(!bountiedContract.checkInvariant());
        _;
    }

	/*
     * Public functions
     */

    /// @dev CodeBugBounty(): instantiates a new draft code bug bounty
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _contactInfo the contact information of the issuer
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
    /// @param _bountiedContract the address of the contract to be bountied (with invariants check implemented)
    /// @param _numMilestones the total number of milestones which can be paid out

    function CodeBugBounty(
        uint _deadline,
        string _contactInfo,
        string _data,
        uint[] _fulfillmentAmounts,
        uint _numMilestones,
        Bountied _bountiedContract

    )
    	StandardBounty(
    		_deadline,
    		_contactInfo,
        	_data,
        	_fulfillmentAmounts,
        	_numMilestones
    	)
    	checkBountiedInvariants(_bountiedContract)
    {
        bountiedContract = _bountiedContract;
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds [OVERWRITTEN FROM StandardBounty]
    /// @param fulfillmentId the index of the fulfillment being accepted
    /// @param milestoneId the id of the milestone being accepted
    function acceptFulfillment(uint fulfillmentId, uint milestoneId)
        public
        onlyIssuer
        isAtStage(BountyStages.Active)
        validateFulfillmentArrayIndex(fulfillmentId, milestoneId)
        validateMilestoneIndex(milestoneId)
        checkBountiedInvariantsFailed()
    {
        fulfillments[milestoneId][fulfillmentId].accepted = true;
        accepted[milestoneId].push(fulfillmentId);
        numAccepted[milestoneId] ++;

        killBounty();

        FulfillmentAccepted(msg.sender, fulfillmentId, milestoneId);
    }

}
