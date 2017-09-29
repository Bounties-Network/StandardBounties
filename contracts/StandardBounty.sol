pragma solidity ^0.4.17;


/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment through
/// stepwise work submission, acceptance, and payment
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounties {

  /*
   * Events
   */
  event BountyIssued(uint bountyId);
  event BountyActivated(uint bountyId, address issuer);
  event BountyFulfilled(uint bountyId, address indexed fulfiller, uint256 indexed _milestoneId, uint256 indexed _fulfillmentId);
  event FulfillmentAccepted(uint bountyId, address indexed fulfiller, uint256 indexed _milestoneId, uint256 indexed _fulfillmentId);
  event FulfillmentPaid(uint bountyId, address indexed fulfiller, uint256 indexed _milestoneId, uint256 indexed _fulfillmentId);
  event BountyKilled(uint bountyId);
  event ContributionAdded(uint bountyId, address indexed contributor, uint256 value);
  event DeadlineExtended(uint bountyId, uint newDeadline);
  event BountyChanged(uint bountyId);

  /*
   * Storage
   */

  address public owner;

  Bounty[] public bounties;
  BountyFulfillments[] public works;

  /*
   * Enums
   */

  enum BountyStages {
      Draft,
      Active,
      Dead
  }

  /*
   * Structs
   */

  struct Bounty {
    address issuer;
    address arbiter;
    BountyStages bountyStage;
    uint deadline;
    string data;
    uint[] fulfillmentAmounts;
    uint amountToPay;
    uint unpaidAmount;
    uint balance;
  }

  struct BountyFulfillments{
    mapping(uint=>Fulfillment[]) fulfillments;
    mapping(uint=>uint) numAccepted;
    mapping(uint=>uint) numPaid;
  }

  struct Fulfillment {
      bool paid;
      bool accepted;
      address fulfiller;
      string data;
  }

  /*
   * Modifiers
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
  modifier validateBountyArrayIndex(uint _bountyId){
    require(_bountyId < bounties.length);
    _;
  }
  modifier onlyIssuer(uint _bountyId) {
      require(msg.sender == bounties[_bountyId].issuer);
      _;
  }
  modifier onlyIssuerOrArbiter(uint _bountyId) {
      require(msg.sender == bounties[_bountyId].issuer || (msg.sender == bounties[_bountyId].arbiter && bounties[_bountyId].arbiter != address(0)));
      _;
  }
  modifier notIssuerOrArbiter(uint _bountyId) {
      require(msg.sender != bounties[_bountyId].issuer && msg.sender != bounties[_bountyId].arbiter);
      _;
  }

  modifier onlyFulfiller(uint _bountyId, uint _milestoneId, uint _fulfillmentId) {
      require(msg.sender == works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].fulfiller);
      _;
  }
   modifier amountIsNotZero(uint amount) {
      require(amount != 0);
      _;
  }
  modifier amountsNotZeroAndEqualSum(uint[] _amounts, uint _sum) {
      uint sum = 0;
      uint oldSum = 0;
      for (uint i = 0; i < _amounts.length; i++){
          oldSum = sum;
          sum = oldSum + _amounts[i];
          require(sum > oldSum);
      }
      require (sum == _sum);
      _;
  }

  modifier amountEqualsValue(uint _amount) {
      require((_amount * 1 wei) == msg.value);
      _;
  }

  modifier isBeforeDeadline(uint _bountyId) {
      require(now < bounties[_bountyId].deadline);
      _;
  }

  modifier validateDeadline(uint _newDeadline) {
      require(_newDeadline > now);
      _;
  }

  modifier newDeadlineIsValid(uint _bountyId, uint _newDeadline) {
      require(_newDeadline > bounties[_bountyId].deadline);
      _;
  }

  modifier isAtStage(uint _bountyId, BountyStages _desiredStage) {
      require(bounties[_bountyId].bountyStage == _desiredStage);
      _;
  }


  modifier isNotDead(uint _bountyId) {
      require(bounties[_bountyId].bountyStage != BountyStages.Dead);
      _;
  }

  modifier validateFulfillmentArrayIndex(uint _bountyId, uint _milestoneId, uint _index) {
      require(_index < works[_bountyId].fulfillments[_milestoneId].length);
      _;
  }

  modifier validateMilestoneIndex(uint _bountyId, uint _milestoneId){
      require(_milestoneId < bounties[_bountyId].fulfillmentAmounts.length);
      _;
  }

  modifier fulfillmentNotYetAccepted(uint _bountyId, uint _milestoneId, uint _fulfillmentId) {
      require(works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].accepted == false);
      _;
  }
  modifier newFulfillmentAmountIsIncrease(uint _bountyId, uint _milestoneId, uint _newFulfillmentAmount) {
      require(bounties[_bountyId].fulfillmentAmounts[_milestoneId] < _newFulfillmentAmount);
      _;
  }

  modifier checkFulfillmentIsApprovedAndUnpaid(uint _bountyId, uint _milestoneId, uint _fulfillmentId) {
      require(works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].accepted && !works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].paid);
      _;
  }

  modifier validateFunding(uint _bountyId) {
      uint total = 0;
      for (uint i = 0 ; i < bounties[_bountyId].fulfillmentAmounts.length; i++){
          total = total + bounties[_bountyId].fulfillmentAmounts[i];
      }
      require (bounties[_bountyId].balance >= (total + bounties[_bountyId].amountToPay));
      _;
  }

  modifier duesRemain(uint _bountyId, uint _milestoneId) {
      if (works[_bountyId].numAccepted[_milestoneId] != 0){
        require((bounties[_bountyId].unpaidAmount + bounties[_bountyId].fulfillmentAmounts[_milestoneId]) <= bounties[_bountyId].balance);
      }
      require((bounties[_bountyId].amountToPay +
               bounties[_bountyId].fulfillmentAmounts[_milestoneId])
                 <= bounties[_bountyId].balance);
      _;
  }

  modifier notYetAccepted(uint _bountyId, uint _milestoneId, uint _fulfillmentId){
      require(works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].accepted == false);
      _;
  }

  modifier fundsRemainToPayDues(uint _bountyId, uint _milestoneId, uint _difference){
      if (works[_bountyId].numAccepted[_milestoneId] == 0){
        require(bounties[_bountyId].balance >= (bounties[_bountyId].unpaidAmount + _difference));
      }
      require(bounties[_bountyId].balance >=
        (bounties[_bountyId].amountToPay +
        (_difference *
          (works[_bountyId].numAccepted[_milestoneId] -
           works[_bountyId].numPaid[_milestoneId]))));
      _;
  }

  /*
   * Public functions
   */


  /// @dev StandardBounties(): instantiates
  /// @param _owner the issuer of the standardbounties contract, who has the
  /// ability to remove bounties
  function StandardBounties(address _owner)
      public
  {
      owner = _owner;
  }


  /// @dev issueBounty(): instantiates a new draft bounty
  /// @param _issuer the address of the intended issuer of the bounty
  /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
  /// @param _data the requirements of the bounty
  /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
  /// @param _totalFulfillmentAmounts the sum of the individual fulfillment amounts
  /// @param _arbiter the address of the arbiter who can mediate claims
  function issueBounty(
      address _issuer,
      uint _deadline,
      string _data,
      uint256[] _fulfillmentAmounts,
      uint _totalFulfillmentAmounts,
      address _arbiter
  )
      public
      amountsNotZeroAndEqualSum(_fulfillmentAmounts, _totalFulfillmentAmounts)
      validateDeadline(_deadline)
      returns (uint)
  {
      Bounty storage newBounty;
      newBounty.issuer = _issuer;
      newBounty.bountyStage = BountyStages.Draft;
      newBounty.deadline = _deadline;
      newBounty.data = _data;
      newBounty.arbiter = _arbiter;
      newBounty.fulfillmentAmounts = _fulfillmentAmounts;
      newBounty.amountToPay = 0;
      newBounty.unpaidAmount = _totalFulfillmentAmounts;
      bounties.push(newBounty);

      works.push(BountyFulfillments());

      BountyIssued(bounties.length - 1);
      return (bounties.length - 1);
  }

  /// @dev contribute(): a function allowing anyone to contribute ether to a
  /// bounty, as long as it is still before its deadline. Shouldn't keep
  /// ether by accident (hence 'value').
  /// @param _value the amount being contributed in ether to prevent accidental deposits
  /// @notice Please note you funds will be at the mercy of the issuer
  ///  and can be drained at any moment. Be careful!
  function contribute (uint _bountyId, uint _value)
      payable
      public
      isBeforeDeadline(_bountyId)
      isNotDead(_bountyId)
      validateBountyArrayIndex(_bountyId)
      amountIsNotZero(_value)
      amountEqualsValue(_value)
  {
      bounties[_bountyId].balance += _value;
      ContributionAdded(_bountyId, msg.sender, _value);
  }

  /// @notice Send funds to activate the bug bounty
  /// @dev activateBounty(): activate a bounty so it may pay out
  /// @param _value the amount being contributed in ether to prevent
  /// accidental deposits
  function activateBounty(uint _bountyId, uint _value)
      payable
      public
      isBeforeDeadline(_bountyId)
      onlyIssuer(_bountyId)
      validateBountyArrayIndex(_bountyId)
      amountEqualsValue(_value)
      validateFunding(_bountyId)
  {
      bounties[_bountyId].balance += _value;
      transitionToState(_bountyId, BountyStages.Active);

      ContributionAdded(_bountyId, msg.sender, msg.value);
      BountyActivated(_bountyId, msg.sender);
  }

  /// @dev fulfillBounty(): submit a fulfillment for the given bounty
  /// @param _milestoneId the id of the milestone being fulfilled
  /// @param _data the data artifacts representing the fulfillment of the bounty
  function fulfillBounty(uint _bountyId, uint _milestoneId, string _data)
      public
      validateBountyArrayIndex(_bountyId)
      isAtStage(_bountyId, BountyStages.Active)
      isBeforeDeadline(_bountyId)
      validateMilestoneIndex(_bountyId, _milestoneId)
      notIssuerOrArbiter(_bountyId)
  {
      works[_bountyId].fulfillments[_milestoneId].push(Fulfillment(false, false, msg.sender, _data));

      BountyFulfilled(_bountyId, msg.sender, (works[_bountyId].fulfillments[_milestoneId].length - 1), _milestoneId);
  }

  /// @dev updateFulfillment(): Submit updated data for a given fulfillment
  /// @param _milestoneId the index of the milestone
  /// @param _fulfillmentId the index of the fulfillment
  /// @param _data the new data being submitted
  function updateFulfillment(uint _bountyId, uint _milestoneId, uint _fulfillmentId, string _data)
      public
      validateBountyArrayIndex(_bountyId)
      validateMilestoneIndex(_bountyId, _milestoneId)
      validateFulfillmentArrayIndex(_bountyId, _milestoneId, _fulfillmentId)
      onlyFulfiller(_bountyId, _milestoneId, _fulfillmentId)
      notYetAccepted(_bountyId, _milestoneId, _fulfillmentId)
  {
      works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].data = _data;
  }

  /// @dev acceptFulfillment(): accept a given fulfillment
  /// @param _fulfillmentId the index of the fulfillment being accepted
  /// @param _milestoneId the id of the milestone being accepted
  function acceptFulfillment(uint _bountyId, uint _milestoneId, uint _fulfillmentId)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuerOrArbiter(_bountyId)
      isAtStage(_bountyId, BountyStages.Active)
      validateMilestoneIndex(_bountyId, _milestoneId)
      validateFulfillmentArrayIndex(_bountyId, _milestoneId, _fulfillmentId)
      fulfillmentNotYetAccepted(_bountyId, _milestoneId, _fulfillmentId)
      duesRemain(_bountyId, _milestoneId)
  {
      works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].accepted = true;
      bounties[_bountyId].amountToPay += bounties[_bountyId].fulfillmentAmounts[_milestoneId];
      if (works[_bountyId].numAccepted[_milestoneId] == 0){
        bounties[_bountyId].unpaidAmount -= bounties[_bountyId].fulfillmentAmounts[_milestoneId];
      }
      works[_bountyId].numAccepted[_milestoneId]++;

      FulfillmentAccepted(_bountyId, msg.sender, _milestoneId, _fulfillmentId);
  }

  /// @dev fulfillmentPayment(): pay the fulfiller for their work
  /// @param _fulfillmentId the index of the fulfillment being accepted
  /// @param _milestoneId the id of the milestone being paid
  function fulfillmentPayment(uint _bountyId, uint _milestoneId, uint _fulfillmentId)
      public
      validateBountyArrayIndex(_bountyId)
      validateMilestoneIndex(_bountyId, _milestoneId)
      validateFulfillmentArrayIndex(_bountyId, _milestoneId, _fulfillmentId)
      onlyFulfiller(_bountyId, _milestoneId, _fulfillmentId)
      checkFulfillmentIsApprovedAndUnpaid(_bountyId, _milestoneId, _fulfillmentId)
  {
      works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].paid = true;
      works[_bountyId].numPaid[_milestoneId]++;
      bounties[_bountyId].amountToPay -= bounties[_bountyId].fulfillmentAmounts[_milestoneId];
      bounties[_bountyId].balance -= bounties[_bountyId].fulfillmentAmounts[_milestoneId];

      works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].fulfiller.transfer(bounties[_bountyId].fulfillmentAmounts[_milestoneId]);

      FulfillmentPaid(_bountyId, msg.sender, _milestoneId, _fulfillmentId);
  }

  /// @dev killBounty(): drains the contract of it's remaining
  /// funds, and moves the bounty into stage 3 (dead) since it was
  /// either killed in draft stage, or never accepted any fulfillments
  function killBounty(uint _bountyId)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
  {
      bounties[_bountyId].issuer.transfer(bounties[_bountyId].balance - bounties[_bountyId].amountToPay);
      transitionToState(_bountyId, BountyStages.Dead);

      BountyKilled(_bountyId);
  }

  /// @dev extendDeadline(): allows the issuer to add more time to the
  /// bounty, allowing it to continue accepting fulfillments
  /// @param _newDeadline the new deadline in timestamp format
  function extendDeadline(uint _bountyId, uint _newDeadline)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      newDeadlineIsValid(_bountyId, _newDeadline)
  {
      bounties[_bountyId].deadline = _newDeadline;

      DeadlineExtended(_bountyId, _newDeadline);
  }

  /// @dev transferIssuer(): allows the issuer to transfer ownership of the
  /// bounty to some new address
  /// @param _newIssuer the address of the new issuer
  function transferIssuer(uint _bountyId, address _newIssuer)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
  {
      bounties[_bountyId].issuer = _newIssuer;
  }

  /// @dev changeBountyIssuer(): allows the issuer to change a bounty's issuer
  /// @param _newIssuer the new address of the issuer
  function changeBountyIssuer(uint _bountyId, address _newIssuer)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].issuer = _newIssuer;
      BountyChanged(_bountyId);
  }

  /// @dev changeBountyDeadline(): allows the issuer to change a bounty's issuer
  /// @param _newDeadline the new deadline for the bounty
  function changeBountyDeadline(uint _bountyId, uint _newDeadline)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      validateDeadline(_newDeadline)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].deadline = _newDeadline;
      BountyChanged(_bountyId);
  }

  /// @dev changeData(): allows the issuer to change a bounty's issuer
  /// @param _newData the new requirements of the bounty
  function changeBountyData(uint _bountyId, string _newData)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].data = _newData;
      BountyChanged(_bountyId);
  }

  /// @dev changeBountyFulfillmentAmounts(): allows the issuer to change a bounty's issuer
  /// @param _newFulfillmentAmounts the new fulfillment amounts
  /// @param _totalFulfillmentAmounts the sum of the individual fulfillment amounts
  function changeBountyFulfillmentAmounts(uint _bountyId, uint[] _newFulfillmentAmounts, uint _totalFulfillmentAmounts)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      isAtStage(_bountyId, BountyStages.Draft)
      amountsNotZeroAndEqualSum(_newFulfillmentAmounts, _totalFulfillmentAmounts)
  {
      bounties[_bountyId].fulfillmentAmounts = _newFulfillmentAmounts;
      bounties[_bountyId].unpaidAmount = _totalFulfillmentAmounts;
      BountyChanged(_bountyId);
  }

  /// @dev changeBountyArbiter(): allows the issuer to change a bounty's issuer
  /// @param _newArbiter the new address of the arbiter
  function changeBountyArbiter(uint _bountyId, address _newArbiter)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].arbiter = _newArbiter;
      BountyChanged(_bountyId);
  }

  /// @dev increasePayout(): allows the issuer to increase a given fulfillment
  /// amount in the active stage
  /// @param _milestoneId the fulfillment in question
  /// @param _newFulfillmentAmount the new payout amount for a given fulfillment
  function increasePayout(uint _bountyId, uint _milestoneId, uint _newFulfillmentAmount)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      newFulfillmentAmountIsIncrease(_bountyId, _milestoneId, _newFulfillmentAmount)
      fundsRemainToPayDues(_bountyId, (_newFulfillmentAmount - bounties[_bountyId].fulfillmentAmounts[_milestoneId]), _milestoneId)
  {
    uint difference = _newFulfillmentAmount - bounties[_bountyId].fulfillmentAmounts[_milestoneId];
    bounties[_bountyId].amountToPay += ((works[_bountyId].numAccepted[_milestoneId] - works[_bountyId].numPaid[_milestoneId]) * difference);
    if (works[_bountyId].numAccepted[_milestoneId] == 0){
      bounties[_bountyId].unpaidAmount += difference;
    }
    bounties[_bountyId].fulfillmentAmounts[_milestoneId] = _newFulfillmentAmount;
  }

  /// @dev getFulfillment(): Returns the fulfillment at a given index
  /// @param _fulfillmentId the index of the fulfillment to return
  /// @param _milestoneId the index of the milestone to return
  /// @return Returns a tuple for the fulfillment
  function getFulfillment(uint _bountyId, uint _milestoneId, uint _fulfillmentId)
      public
      constant
      validateBountyArrayIndex(_bountyId)
      validateMilestoneIndex(_bountyId, _milestoneId)
      validateFulfillmentArrayIndex(_bountyId, _milestoneId, _fulfillmentId)
      returns (bool, bool, address, string)
  {
      return (works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].paid,
              works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].accepted,
              works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].fulfiller,
              works[_bountyId].fulfillments[_milestoneId][_fulfillmentId].data);
  }

  /// @dev getBounty(): Returns the details of the bounty
  /// @return Returns a tuple for the bounty
  function getBounty(uint _bountyId)
      public
      constant
      validateBountyArrayIndex(_bountyId)
      returns (address, uint, uint, string)
  {
      return (bounties[_bountyId].issuer,
              uint(bounties[_bountyId].bountyStage),
              bounties[_bountyId].deadline,
              bounties[_bountyId].data);
  }

  /// @dev getNumFulfillments() returns the number of fulfillments for a given milestone
  /// @param _milestoneId the ID of the milestone
  /// @return Returns the number of fulfillments
  function getNumFulfillments(uint _bountyId, uint _milestoneId)
      public
      constant
      validateBountyArrayIndex(_bountyId)
      validateMilestoneIndex(_bountyId, _milestoneId)
      returns (uint)
  {
      return works[_bountyId].fulfillments[_milestoneId].length;
  }
  /// @dev getNumMilestones() returns the number of milestones
  /// @return Returns the number of fulfillments
  function getNumMilestones(uint _bountyId)
      public
      constant
      validateBountyArrayIndex(_bountyId)
      returns (uint)
  {
      return bounties[_bountyId].fulfillmentAmounts.length;
  }

  /*
   * Internal functions
   */

  /// @dev transitionToState(): transitions the contract to the
  /// state passed in the parameter `_newStage` given the
  /// conditions stated in the body of the function
  /// @param _newStage the new stage to transition to
  function transitionToState(uint _bountyId, BountyStages _newStage)
      internal
  {
      bounties[_bountyId].bountyStage = _newStage;
  }
}
