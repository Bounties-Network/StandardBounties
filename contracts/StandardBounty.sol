pragma solidity ^0.4.8;


/// @title StandardBounty
/// @dev can be used to facilitate transactions on qualitative data
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounty {

    uint constant public MAX_FULFILLMENTS = 254;

    /*
     * Events
     */

    event BountyActivated(address issuer);
    event BountyFulfilled(address indexed fulfiller, uint256 indexed fulNum);
    event FulfillmentAccepted(address indexed fulfiller, uint256 indexed fulNum);
    event FulfillmentPaid(address indexed fulfiller, uint256 indexed fulNum);
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

    Fulfillment[] public fulfillments; // the list of submitted fulfillments
    uint public numFulfillments; // the number of submitted fulfillments

    uint[] public accepted; // the list of accepted fulfillments
    uint public numAccepted; // the number of accepted fulfillments
    uint public numPaid; // the number of paid fulfillments

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

    modifier checkFulfillmentsNumber() {
        if (numFulfillments > MAX_FULFILLMENTS)
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


    modifier validateFunding() {

        // Funding is validated right before a bounty is moved into the active
        // stage, thus all funds which are surplus to paying out those bounties
        // are refunded. After this, new funds may also be added on an ad-hoc
        // basis
        if ( (msg.value + this.balance) % fulfillmentAmount > 0) {
            if (!msg.sender.send((msg.value + this.balance) % fulfillmentAmount))
                throw;
        }

        _;
    }

    modifier canTransitionToState(BountyStages newStage) {

      /*
      This section feels incomplete to me, however I believe that an issuer
      should be able to return a bounty into the active state regardless of its
      current state- this means that a bounty can be drained, then re-activated,
      as long as the deadline hasn't been met

      its possible that this modifier isn't even required anymore, but I think we should discuss

        // RULE #1
        // Can not go back in Stages unless you're in stage "Fulfilled"
        if (newStage < bountyStage && newStage != BountyStages.Fulfilled)
            throw;

        // RULE #2
        // Can never go back more than one state
        if (newStage < bountyStage - 1)
            throw;

      */
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
    function StandardBounty(
        uint _deadline,
        string _contactInfo,
        string _data,
        uint _fulfillmentAmount
    )
        amountIsNotZero(_fulfillmentAmount)
    {
        issuer = msg.sender;
        issuerContact = _contactInfo;
        bountyStage = BountyStages.Draft;
        deadline = _deadline;
        data = _data;
        fulfillmentAmount = _fulfillmentAmount;

    }

    /// @notice Send funds to activate the bug bounty
    /// @dev activateBounty(): activate a bounty so it may continue to pay out
    function activateBounty()
        payable
        public
        isBeforeDeadline
        onlyIssuer
        validateFunding
        canTransitionToState(BountyStages.Active)
    {
        transitionToState(BountyStages.Active);

        BountyActivated(msg.sender);
    }

    /// @dev fulfillBounty(): submit a fulfillment for the given bounty
    /// @param _data the data artifacts representing the fulfillment of the bounty
    /// @param _dataType a meaningful description of the type of data the fulfillment represents
    function fulfillBounty(string _data, string _dataType)
        public
        isAtStage(BountyStages.Active)
        isBeforeDeadline
        checkFulfillmentsNumber
    {
        fulfillments[numFulfillments] = Fulfillment(false, false, msg.sender, _data, _dataType);

        BountyFulfilled(msg.sender, numFulfillments++);
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param fulNum the index of the fulfillment being accepted
    function acceptFulfillment(uint fulNum)
        public
        onlyIssuer
        isAtStage(BountyStages.Active)
        validateFulfillmentArrayIndex(fulNum)
    {
        fulfillments[fulNum].accepted = true;
        accepted[numAccepted++] = fulNum;

        if (lastFulfillment()){
          transitionToState(BountyStages.Fulfilled);
        }

        FulfillmentAccepted(msg.sender, fulNum);
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

        numPaid++;

        FulfillmentPaid(msg.sender, fulNum);
    }

    /// @dev reclaimBounty(): drains the contract of it's remaining
    /// funds, and moves the bounty into stage 3 (dead) since it was
    /// either killed in draft stage, or never accepted any fulfillments
    function reclaimBounty()
        public
        onlyIssuer
        canTransitionToState(BountyStages.Dead)
    {
        uint unpaidAmount = fulfillmentAmount * (numAccepted - numPaid);

        if (!issuer.send(this.balance - unpaidAmount))
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

    /// @dev (): a fallback function, allowing anyone to contribute ether to a
    /// bounty, as long as it is still before its deadline.
    /// NOTE: THESE FUNDS ARE AT THE MERCY OF THE ISSUER, AND CAN BE
    /// DRAINED AT ANY MOMENT BY THEM. REFUNDS CAN ONLY BE PROVIDED TO THE
    /// ISSUER
    function()
        payable
        isBeforeDeadline
    {
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

    /// @dev lastFulfillment(): determines if the current
    /// fulfillment is the last one which can be accepted,
    /// based on the remaining balance
    function lastFulfillment()
        internal
        returns (bool isFulfilled)

    {
        uint unpaidAmount = fulfillmentAmount * (numAccepted - numPaid);

        isFulfilled = ((this.balance - unpaidAmount) < fulfillmentAmount);

    }
}
