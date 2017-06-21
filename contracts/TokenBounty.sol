pragma solidity ^0.4.11;
import "./StandardBounty.sol";
import "./StandardToken.sol";


/// @title TokenBounty
/// @dev extension of StandardBounty to pay out bounties with a given ERC20 token
/// @author Mark Beylin <mark.beylin@consensys.net>
contract TokenBounty is StandardBounty {

	/*
     * Storage
     */

    StandardToken public tokenContract;

    /*
     * Modifiers
     */


    modifier amountEqualsValue(uint value) {
        require(value  == tokenContract.allowance(msg.sender, this));
        require(tokenContract.transferFrom(msg.sender, this, value));

        _;
    }

    modifier validateFunding() {

        // Funding is validated right before a bounty is moved into the active
        // stage, thus all funds which are surplus to paying out those bounties
        // are refunded. After this, new funds may also be added on an ad-hoc
        // basis

        require (tokenContract.balanceOf(this) >= fulfillmentAmount);

        _;
    }


	/*
     * Public functions
     */

    /// @dev TokenBounty(): instantiates a new draft token bounty
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _contactInfo the contact information of the issuer
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmount the amount of wei to be paid out for each successful fulfillment
    /// @param _tokenAddress the address of the token contract
    function TokenBounty(
        uint _deadline,
        string _contactInfo,
        string _data,
        uint _fulfillmentAmount,
        address _tokenAddress
    )
    	StandardBounty(
    		_deadline,
    		_contactInfo,
        	_data,
        	_fulfillmentAmount
    	)
    {
        tokenContract = StandardToken(_tokenAddress);
    }

    /// @dev contribute(): a function allowing anyone to contribute any token
    /// to a bounty, as long as it is still before its deadline. Shouldn't
    /// keep tokens by accident (hence 'value').
    /// @notice Please note you funds will be at the mercy of the issuer
    ///  and can be drained at any moment. Be careful!
    /// @param value the amount being contributed in tokens to prevent
    /// accidental deposits
    function contribute (uint value)
        payable
        isBeforeDeadline
        amountIsNotZero(value)
        amountEqualsValue(value)
    {
        ContributionAdded(msg.sender, msg.value);
    }

    /// @notice Send funds to activate the bug bounty
    /// @dev activateBounty(): activate a bounty so it may continue to pay out
    /// @param value the amount being contributed in ether to prevent
    /// accidental deposits
    function activateBounty(uint value)
        payable
        public
        isBeforeDeadline
        onlyIssuer
        amountIsNotZero(value)
        amountEqualsValue(value)
        validateFunding
    {
        ContributionAdded(msg.sender, msg.value);

        transitionToState(BountyStages.Active);

        BountyActivated(msg.sender);
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param fulNum the index of the fulfillment being accepted
    function fulfillmentPayment(uint fulNum)
        public
        validateFulfillmentArrayIndex(fulNum)
        onlyFulfiller(fulNum)
        checkFulfillmentIsApprovedAndUnpaid(fulNum)
    {
        tokenContract.transfer(fulfillments[fulNum].fulfiller, fulfillmentAmount);
        fulfillments[fulNum].paid = true;

        numPaid++;

        FulfillmentPaid(msg.sender, fulNum);
    }

    /// @dev killBounty(): drains the contract of it's remaining
    /// funds, and moves the bounty into stage 3 (dead) since it was
    /// either killed in draft stage, or never accepted any fulfillments
    function killBounty()
        public
        onlyIssuer
    {
        issuer.transfer(tokenContract.balanceOf(this) - unpaidAmount());

        transitionToState(BountyStages.Dead);

        BountyKilled();
    }

}
