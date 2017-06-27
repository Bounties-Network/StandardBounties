pragma solidity ^0.4.11;


/// @title StandardBounty
/// @dev can be used to facilitate transactions on qualitative data
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounty {

    uint constant public MAX_FULFILLMENTS = 254;

    /*
     * Events
     */

    event BountyActivated(address issuer);
    event BountyFulfilled(address indexed fulfiller, uint256 indexed fulfillmentId, uint256 indexed milestoneId);
    event FulfillmentAccepted(address indexed fulfiller, uint256 indexed fulfillmentId, uint256 indexed milestoneId);
    event FulfillmentPaid(address indexed fulfiller, uint256 indexed fulfillmentId, uint256 indexed milestoneId);
    event BountyKilled();
    event ContributionAdded(address indexed contributor, uint256 value);
    event DeadlineExtended(uint newDeadline);

    /*
     * Storage
     */

    address public issuer; //the creator of the bounty
    string public issuerContact; //string of a contact method used to reach the issuer in case it is needed

    BountyStages public bountyStage;

    uint public deadline; //unix timestamp for deadline
    string public data; //data representing the requirements for the bounty, and any associated files - this is commonly an IPFS hash but in reality could be anything the bounty creator desires

    uint[] public fulfillmentAmounts; // the amount of wei to be rewarded to the user who fulfills the bounty

    mapping(uint=>Fulfillment[]) public fulfillments; // the list of submitted fulfillments
    mapping(uint=>uint) public numFulfillments; // the number of submitted fulfillments
    uint public numMilestones; // the number of milestones which can be paid out

    mapping(uint=>uint[]) public accepted; // the list of accepted fulfillments
    mapping(uint=>uint) public numAccepted; // the number of accepted fulfillments
    mapping(uint=>uint) public numPaid; // the number of paid fulfillments

    /*
     * Enums
     */

    enum BountyStages {
        Draft,
        Active,
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
        require(msg.sender == issuer);
        _;
    }
    modifier notIssuer() {
        require(msg.sender != issuer);
        _;
    }

    modifier onlyFulfiller(uint fulfillmentId, uint milestoneId) {
        require(msg.sender == fulfillments[milestoneId][fulfillmentId].fulfiller);
        _;
    }
     modifier amountIsNotZero(uint amount) {
            require(amount != 0);
        _;
    }
    modifier amountsNotZero(uint[] amount) {
        for (uint i = 0; i < amount.length; i++){
            require(amount[i] != 0);
        }
        _;
    }

    modifier amountEqualsValue(uint amount) {
        require((amount * 1 wei) == msg.value);
        _;
    }

    modifier isBeforeDeadline() {
        require(now < deadline);
        _;
    }

    modifier validateDeadline(uint newDeadline) {
        require(newDeadline > now);
        _;
    }

    modifier newDeadlineIsValid(uint newDeadline) {
        require(newDeadline > deadline);
        _;
    }

    modifier isAtStage(BountyStages desiredStage) {
        require(bountyStage == desiredStage);
        _;
    }

    modifier checkFulfillmentsNumber(uint milestoneId) {
        require(numFulfillments[milestoneId] < MAX_FULFILLMENTS);
        _;
    }

    modifier validateFulfillmentArrayIndex(uint index, uint milestoneId) {
        require(index < numFulfillments[milestoneId]);
        _;
    }

    modifier validateMilestoneIndex(uint milestoneId){
        require(milestoneId < numMilestones);
        _;
    }

    modifier checkFulfillmentIsApprovedAndUnpaid(uint fulfillmentId, uint milestoneId) {
        require(fulfillments[milestoneId][fulfillmentId].accepted && !fulfillments[milestoneId][fulfillmentId].paid);
        _;
    }


    modifier validateFunding() {

        // Funding is validated right before a bounty is moved into the active
        // stage, thus all funds which are surplus to paying out those bounties
        // are refunded. After this, new funds may also be added on an ad-hoc
        // basis
        uint total = 0;
        for (uint i = 0 ; i < numMilestones; i++){
            total += fulfillmentAmounts[i];
        }

        require ((this.balance) >= total);
        _;
    }

    modifier correctLengths(uint numMilestones, uint length) {
        require(numMilestones == length);
        _;
    }


    /*
     * Public functions
     */

    /// @dev StandardBounty(): instantiates a new draft bounty
    /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
    /// @param _contactInfo a string with contact info of the issuer, for them to be contacted if needed
    /// @param _data the requirements of the bounty
    /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
    /// @param _numMilestones the total number of milestones which can be paid out
    function StandardBounty(
        uint _deadline,
        string _contactInfo,
        string _data,
        uint[] _fulfillmentAmounts,
        uint _numMilestones
    )
        amountsNotZero(_fulfillmentAmounts)
        validateDeadline(_deadline)
        correctLengths(_numMilestones, _fulfillmentAmounts.length)
    {
        issuer = tx.origin;
        issuerContact = _contactInfo;
        bountyStage = BountyStages.Draft;
        deadline = _deadline;
        data = _data;
        numMilestones = _numMilestones;


        fulfillmentAmounts = _fulfillmentAmounts;

    }



    /// @dev contribute(): a function allowing anyone to contribute ether to a
    /// bounty, as long as it is still before its deadline. Shouldn't
    /// keep ether by accident (hence 'value').
    /// @notice Please note you funds will be at the mercy of the issuer
    ///  and can be drained at any moment. Be careful!
    /// @param value the amount being contributed in ether to prevent
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
    /// @dev activateBounty(): activate a bounty so it may pay out
    function activateBounty()
        payable
        public
        isBeforeDeadline
        onlyIssuer
        validateFunding
    {
        transitionToState(BountyStages.Active);

        BountyActivated(msg.sender);
    }

    /// @dev fulfillBounty(): submit a fulfillment for the given bounty
    /// @param _data the data artifacts representing the fulfillment of the bounty
    /// @param _dataType a meaningful description of the type of data the fulfillment represents
    /// @param milestoneId the id of the milestone being fulfilled
    function fulfillBounty(string _data, string _dataType, uint milestoneId)
        public
        isAtStage(BountyStages.Active)
        isBeforeDeadline
        checkFulfillmentsNumber(milestoneId)
        notIssuer
    {
        fulfillments[milestoneId].push(Fulfillment(false, false, msg.sender, _data, _dataType));

        BountyFulfilled(msg.sender, numFulfillments[milestoneId]++, milestoneId);
    }


    /// @dev acceptFulfillment(): accept a given fulfillment
    /// @param fulfillmentId the index of the fulfillment being accepted
    /// @param milestoneId the id of the milestone being accepted
    function acceptFulfillment(uint fulfillmentId, uint milestoneId)
        public
        onlyIssuer
        isAtStage(BountyStages.Active)
        validateMilestoneIndex(milestoneId)
        validateFulfillmentArrayIndex(fulfillmentId, milestoneId)
    {
        fulfillments[milestoneId][fulfillmentId].accepted = true;
        accepted[milestoneId].push(fulfillmentId);
        numAccepted[milestoneId]++;

        FulfillmentAccepted(msg.sender, fulfillmentId, milestoneId);
    }

    /// @dev fulfillmentPayment(): pay the fulfiller for their work
    /// @param fulfillmentId the index of the fulfillment being accepted
    /// @param milestoneId the id of the milestone being paid
    function fulfillmentPayment(uint fulfillmentId, uint milestoneId)
        public
        validateFulfillmentArrayIndex(fulfillmentId, milestoneId)
        validateMilestoneIndex(milestoneId)
        onlyFulfiller(fulfillmentId, milestoneId)
        checkFulfillmentIsApprovedAndUnpaid(fulfillmentId, milestoneId)
    {
        fulfillments[milestoneId][fulfillmentId].fulfiller.transfer(fulfillmentAmounts[milestoneId]);
        fulfillments[milestoneId][fulfillmentId].paid = true;

        numPaid[milestoneId]++;

        FulfillmentPaid(msg.sender, fulfillmentId, milestoneId);
    }

    /// @dev killBounty(): drains the contract of it's remaining
    /// funds, and moves the bounty into stage 3 (dead) since it was
    /// either killed in draft stage, or never accepted any fulfillments
    function killBounty()
        public
        onlyIssuer
    {
        issuer.transfer(this.balance - unpaidAmount());

        transitionToState(BountyStages.Dead);

        BountyKilled();
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
    /// @dev getFulfillment(): Returns the fulfillment at a given index
    /// @param fulfillmentId the index of the fulfillment to return
    /// @param milestoneId the index of the milestone to return
    function getFulfillment(uint fulfillmentId, uint milestoneId)
        public
        constant
        returns (bool, bool, address, string, string)
    {
        return (fulfillments[milestoneId][fulfillmentId].paid,
                fulfillments[milestoneId][fulfillmentId].accepted,
                fulfillments[milestoneId][fulfillmentId].fulfiller,
                fulfillments[milestoneId][fulfillmentId].data,
                fulfillments[milestoneId][fulfillmentId].dataType);
    }

    /// @dev getBounty(): Returns the details of the bounty
    function getBounty()
        public
        constant
        returns (address, string, uint, uint, string, uint)
    {
        return (issuer,
                issuerContact,
                uint(bountyStage),
                deadline,
                data,
                numMilestones);


    }


    /*
     * Internal functions
     */


    /// @dev unpaidAmount(): calculates the amount which
    /// the bounty has yet to pay out
    function unpaidAmount()
        public
        constant
        returns (uint unpaidAmount)
    {
        for (uint i = 0; i < numMilestones; i++){
            unpaidAmount += fulfillmentAmounts[i] * (numAccepted[i] - numPaid[i]);
        }
    }

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
