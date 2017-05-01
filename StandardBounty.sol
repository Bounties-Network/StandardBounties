pragma solidity ^0.4.8;


/// @title StandardBounty
/// @dev can be used to facilitate transactions on qualitative data
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounty {

    /*
     * Events
     */

    event BountyActivated(address issuer);
    event BountyFulfilled(address indexed fulfiller);
    event FulfillmentAccepted(address indexed fulfiller, uint256 fulfillmentAmount);
    event BountyReclaimed();
    event DeadlineExtended(uint newDeadline);

    /*
     * Storage
     */

    address public issuer; //the creator of the bounty
    
    BountyStages public bountyStage; 

    uint public deadline; //unix timestamp for deadline
    string public data; //data representing the requirements for the bounty, and any associated files - this is commonly an IPFS hash but in reality could be anything the bounty creator desires


    uint public fulfillmentAmount; // the amount of wei to be rewarded to the user who fulfills the bounty
    bool public fulfillmentApproval; // whether or not a fulfillment must be approved before the bounty can be claimed

    Fulfillment[] public fulfillments; // the list of submitted fulfillments
    uint public numFulfillments; // the number of submitted fulfillments

    uint[] public acceptedFulfillmentIndexes; // the list of accepted fulfillments
    uint public numAccepted; // the number of accepted fulfillments

    /*
     * Enums
     */

    enum BountyStages {
        Draft,
        Active,
        Fulfilled,
        Dead // bounties past deadline with no accepted fulfillments
    }

    /*
     * Structs
     */

    struct Fulfillment {
        bool accepted;
        address fulfiller;
        string data;
        string dataType;
    }

    /*
     * Modifiers
     */

    modifier onlyIssuer() {
        if (msg.sender != issuer)
            throw;
        _;
    }

    modifier onlyFulfiller(uint fulNum) {
        if (msg.sender != fulfillments[fulNum].fulfiller)
            throw;
        _;
    }

    modifier isBeforeDeadline() {
        if (now > deadline)
            throw;
        _;
    }

    modifier newDeadlineIsValid(uint newDeadline) {
        if (newDeadline <= deadline)
            throw;
        _;
    }

    modifier isAtStage(BountyStages desiredStage) {
        if (bountyStage != desiredStage)
            throw;
        _;
    }

    modifier validateFulfillmentArrayIndex(uint index) {
        if (index >= numFulfillments)
            throw;
        _;
    }

    modifier approvalIsNotAutomatic() {
        if (fulfillmentApproval)
            throw;
        _;
    }

    modifier validateFunding() {
        // Less than the minimum contribution is not allowed
        if (msg.value < fulfillmentAmount)
            throw;

        // If automatic approval is TRUE then it makes no sense
        // to have more than one `fulfillmentAmount` to withdraw
        // given they could withdraw it all by repeatedly sending
        // the same fulfillment
        if(fulfillmentApproval && msg.value > fulfillmentAmount) {
            if (!msg.sender.send(msg.value - fulfillmentAmount))
                throw;
        }

        // If automatic approval is FALSE then issuer may want
        // to pay multiple and different fulfillments at his discretion
        // however only makes sense to accept multiples of `fulfillmentAmount`
        if(!fulfillmentApproval && msg.value % fulfillmentAmount > 0) {
            if (!msg.sender.send(msg.value - (msg.value % fulfillmentAmount)))
                throw;
        }

        _;
    }

    /*
     * Public functions
     */

    /// @dev Bounty(): instantiates a new draft bounty, activating it if sufficient funds exist to pay out the bounty
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmount the amount of wei to be paid out for each successful fulfillment
    /// @param _fulfillmentApproval whether or not a fulfillment must be approved for one to claim the reward
    /// @param _activateNow Whether the issuer wishes to activate the bounty now (assuming sufficient
    /// funds are held) or wait until a later date to activate it
    function StandardBounty(
        uint _deadline,
        string _data,
        uint _fulfillmentAmount,
        bool _fulfillmentApproval
    ) {
        issuer = msg.sender;
        bountyStage = BountyStages.Draft;
        deadline = _deadline;
        data = _data;
        fulfillmentApproval = _fulfillmentApproval;
        fulfillmentAmount = _fulfillmentAmount;

    }
  
    /// @notice Send funds to activate the bug bounty
    /// @dev addFundsToActivateBounty(): adds more funds to a bounty so 
    /// it may continue to pay out to fulfillers
    function addFundsToActivateBounty()
        payable
        public
        isBeforeDeadline
        onlyIssuer
        validateFunding
    {
        transitionToState(BountyStages.Active);

        BountyActivated(msg.sender);
    }

    /// @dev fulfillBounty(): submit a fulfillment for the given bounty,
    /// while also claiming the reward (if approval isn't required)
    /// @param _data the data artifacts representing the fulfillment of the bounty
    /// @param _dataType a meaningful description of the type of data the fulfillment represents
    function fulfillBounty(string _data, string _dataType)
        public
        isBeforeDeadline
    {
        fulfillments[numFulfillments] = Fulfillment(fulfillmentApproval, msg.sender, _data, _dataType);
        numFulfillments ++;

        BountyFulfilled(msg.sender);
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param fulNum the index of the fulfillment being accepted
    function acceptFulfillment(uint fulNum)
        public
        approvalIsNotAutomatic
        onlyIssuer
        isAtStage(BountyStages.Active)
        validateFulfillmentArrayIndex(fulNum)
    {
        fulfillments[fulNum].accepted = true;
        accepted[numAccepted] = fulNum;
        numAccepted ++;

        FulfillmentAccepted(msg.sender, fulfillmentAmount);
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param fulNum the index of the fulfillment being accepted
    function fulfillmentPayment(uint fulNum)
        public
        isAtStage(BountyStages.Active)
        validateFulfillmentArrayIndex(fulNum)
        onlyFulfiller(fulNum)
    {
        accepted[numAccepted] = fulfillments[fulNum];
        numAccepted ++;

        if (!fulfillments[fulNum].fulfiller.send(fulfillmentAmount))
            throw;

        transitionToState(BountyStages.Fulfilled);

        FulfillmentAccepted(msg.sender, fulfillmentAmount);
    }

    /// @dev reclaimBounty(): drains the contract of it's remaining
    /// funds, and moves the bounty into stage 3 (dead) since it was
    /// either killed in draft stage, or never accepted any fulfillments
    function reclaimBounty()
        public
        onlyIssuer
        transitionToState(BountyStages.Dead)
    {
        if (!issuer.send(this.balance))
            throw;

        BountyReclaimed();
    }

    /// @dev extendDeadline(): allows the issuer to add more time to the
    /// bounty, allowing it to continue accepting fulfillments
    /// @param _newDeadline the new deadline in timestamp format
    function extendDeadline(uint _newDeadline)
        public
        onlyIssuer
        newDeadlineIsValid(_newDeadline)
    {
        deadline = _newDeadline;

        DeadlineExtended(_newDeadline);
    }

    /*
     * Internal functions
     */

    /// @dev transitionToState(): transitions the contract to the 
    /// state passed in the parameter `_newStage`
    /// @param _newStage the new stage to transition to
    function transitionToState(BountyStages _newStage)
        internal
    {
        if (_newStage == BountyStages.Active)
            bountyStage = _newStage;
        else if (_newStage == BountyStages.Dead && (bountyStage == BountyStages.Draft || bountyStage == BountyStages.Active))
            bountyStage = _newStage;
        else if (_newStage == BountyStages.Fulfilled && this.balance < fulfillmentAmount) {
            bountyStage = _newStage;
            if (!issuer.send(this.balance))
                throw;
        }
    }
}
