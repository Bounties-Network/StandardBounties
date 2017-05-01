pragma solidity ^0.4.8;


/// @title StandardBounty
/// @dev can be used to facilitate transactions on qualitative data
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounty {

    /*
     * Events
     */

    event BountyActivated(address indexed issuer);
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

    Fulfillment[] public accepted; // the list of accepted fulfillments
    uint public numAccepted; // the number of accepted fulfillments

    /*
     * Enums
     */

    // The stage of the bounty
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
        address fulfiller;
        string data;
        string dataType;
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
        bool _fulfillmentApproval,
        bool _activateNow
    )
        payable
    {
        if (_deadline <= this.timestamp)
            throw;

        issuer = msg.sender;
        bountyStage = BountyStages.Draft; //automatically in draft stage

        deadline = _deadline;
        data = _data;

        fulfillmentApproval = _fulfillmentApproval;
        fulfillmentAmount = _fulfillmentAmount;

        if (msg.value >= _fulfillmentAmount && _activateNow) {
            bountyStage = BountyStages.Active; // Sender supplied bounty with sufficient funds
        }

    }
  
    /// @notice Send funds to activate the bug bounty
    /// @dev addFundsToActivateBounty(): adds more funds to a bounty so 
    /// it may continue to pay out to fulfillers
    function addFundsToActivateBounty()
        payable
        public
    {
        if (block.timestamp >= deadline)
            throw;
        if (this.balance >= fulfillmentAmount && msg.sender == issuer) {
            bountyStage = BountyStages.Active;
        }

        BountyActivated(msg.sender);
    }

    /// @dev fulfillBounty(): submit a fulfillment for the given bounty,
    /// while also claiming the reward (if approval isn't required)
    /// @param _data the data artifacts representing the fulfillment of the bounty
    /// @param _dataType a meaningful description of the type of data the fulfillment represents
    function fulfillBounty(string _data, string _dataType)
        public
    {
        if (msg.sender != issuer || block.timestamp > deadline)
            throw;

        fulfillments[numFulfillments] = Fulfillment(msg.sender, _data, _dataType);
        numFulfillments ++;

        if (!fulfillmentApproval) { //fulfillment doesn't need to be approved to pay out
            if (!msg.sender.send(fulfillmentAmount))
                throw;
            if (this.balance < fulfillmentAmount) {
                bountyStage = BountyStages.Fulfilled;
            }
        }

        BountyFulfilled(msg.sender);
    }

    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param fulNum the index of the fulfillment being accepted
    function acceptFulfillment(uint fulNum)
        public
    {
        if (msg.sender != issuer)
            throw;
        if (bountyStage != BountyStages.Active)
            throw;
        if (fulNum >= numFulfillments)
            throw;

        accepted[numAccepted] = fulfillments[fulNum];
        numAccepted ++;

        if (!fulfillments[fulNum].fulfiller.send(fulfillmentAmount))
            throw;

        if (this.balance < fulfillmentAmount) {
            bountyStage = BountyStages.Fulfilled;
            if (!issuer.send(this.balance))
                throw;
        }

        FulfillmentAccepted(msg.sender, fulfillmentAmount);
    }

    /// @dev reclaimBounty(): drains the contract of it's remaining
    /// funds, and moves the bounty into stage 3 (dead) since it was
    /// either killed in draft stage, or never accepted any fulfillments
    function reclaimBounty()
        public
    {
        if (bountyStage == BountyStages.Draft || bountyStage == BountyStages.Active) {
            bountyStage = BountyStages.Dead;
        }
        if (!issuer.send(this.balance))
            throw;

        BountyReclaimed();
    }

    /// @dev extendDeadline(): allows the issuer to add more time to the
    /// bounty, allowing it to continue accepting fulfillments
    function extendDeadline(uint _newDeadline)
        public
    {
        if (msg.sender != issuer)
            throw;

        if (_newDeadline > deadline) {
            deadline = _newDeadline;
        }
        DeadlineExtended(_newDeadline);
    }


}
