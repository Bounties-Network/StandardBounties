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
    event FulfillmentAccepted(address indexed fulfiller);
    event BountyReclaimed();
    event DeadlineExtended(uint newDeadline);

    /*
     * Storage
     */

    address public issuer; //the creator of the bounty
    string public issuerContact; //string of a contact method used to reach the issuer in case it is needed
    
    BountyStages public bountyStage; 

    uint public deadline; //unix timestamp for deadline
    string public data; //data representing the requirements for the bounty, and any associated files - this is commonly an IPFS hash but in reality could be anything the bounty creator desires


    uint public fulfillmentAmount; // the amount of wei to be rewarded to the user who fulfills the bounty
    bool public fulfillmentApproval; // whether or not a fulfillment must be approved before the bounty can be claimed

    Fulfillment[] public fulfillments; // the list of submitted fulfillments
    uint public numFulfillments; // the number of submitted fulfillments

    uint[] public accepted; // the list of accepted fulfillments
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
        bool paid;
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

    modifier amountIsNotZero(uint amount) {
        if (amount != 0)
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

    modifier checkFulfillmentIsApprovedAndUnpaid(uint fulNum) {
        if (fulfillments[fulNum].accepted && fulfillments[fulNum].paid)
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
        if (fulfillmentApproval && msg.value > fulfillmentAmount) {
            if (!msg.sender.send(msg.value - fulfillmentAmount))
                throw;
        }

        // If automatic approval is FALSE then issuer may want
        // to pay multiple and different fulfillments at his discretion
        // however only makes sense to accept multiples of `fulfillmentAmount`
        if (!fulfillmentApproval && msg.value % fulfillmentAmount > 0) {
            if (!msg.sender.send(msg.value % fulfillmentAmount))
                throw;
        }

        _;
    }

    modifier canTransitionToState(BountyStages newStage) {
        // RULE #1
        // Can not go back in Stages unless you're in stage "Fulfilled"
        if (newStage < bountyStage && newStage != BountyStages.Fulfilled)
            throw;

        // RULE #2
        // Can never go back more than one state
        if (newStage < bountyStage - 1)
            throw;

        _;
    }

    /*
     * Public functions
     */

    /// @dev StandardBounty(): instantiates a new draft bounty
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _contactInfo a string with contact info of the issuer, for them to be contacted if needed
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmount the amount of wei to be paid out for each successful fulfillment
    /// @param _fulfillmentApproval whether or not a fulfillment must be approved for one to claim the reward
    function StandardBounty(
        uint _deadline,
        string _contactInfo,
        string _data,
        uint _fulfillmentAmount,
        bool _fulfillmentApproval
    )
        amountIsNotZero(_fulfillmentAmount)
    {
        issuer = msg.sender;
        issuerContact = _contactInfo;
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
        fulfillments[numFulfillments] = Fulfillment(false, fulfillmentApproval, msg.sender, _data, _dataType);
        numFulfillments ++;

        transitionToState(BountyStages.Fulfilled);

        BountyFulfilled(msg.sender);
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param fulNum the index of the fulfillment being accepted
    /// @param _newStage the new stage to transition to
    function acceptFulfillment(uint fulNum, BountyStages _newStage)
        public
        approvalIsNotAutomatic
        onlyIssuer
        isAtStage(BountyStages.Fulfilled)
        validateFulfillmentArrayIndex(fulNum)
        canTransitionToState(_newStage)
    {
        fulfillments[fulNum].accepted = true;
        accepted[numAccepted] = fulNum;
        numAccepted ++;

        transitionToState(_newStage);

        FulfillmentAccepted(msg.sender);
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
        if (!fulfillments[fulNum].fulfiller.send(fulfillmentAmount))
            throw;

        FulfillmentAccepted(msg.sender, fulfillmentAmount);
    }

    /// @dev reclaimBounty(): drains the contract of it's remaining
    /// funds, and moves the bounty into stage 3 (dead) since it was
    /// either killed in draft stage, or never accepted any fulfillments
    function reclaimBounty()
        public
        onlyIssuer
    {
        if (!issuer.send(this.balance))
            throw;

        transitionToState(BountyStages.Dead);

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
    /// state passed in the parameter `_newStage` given the
    /// conditions stated in the body of the function
    /// @param _newStage the new stage to transition to
    function transitionToState(BountyStages _newStage)
        internal
    {
        bountyStage = _newStage;
    }
}
