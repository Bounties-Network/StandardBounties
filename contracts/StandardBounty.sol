pragma solidity ^0.4.11;


/// @title StandardBounty
/// @dev Used to pay out individuals or groups for task fulfillment through
/// stepwise work submission, acceptance, and payment
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounty {

  /*
   * Events
   */

  event BountyActivated(address issuer);
  event BountyFulfilled(address indexed fulfiller, uint256 indexed _milestoneId, uint256 indexed _fulfillmentId);
  event FulfillmentAccepted(address indexed fulfiller, uint256 indexed _milestoneId, uint256 indexed _fulfillmentId);
  event FulfillmentPaid(address indexed fulfiller, uint256 indexed _milestoneId, uint256 indexed _fulfillmentId);
  event BountyKilled();
  event ContributionAdded(address indexed contributor, uint256 value);
  event DeadlineExtended(uint newDeadline);

  /*
   * Storage
   */

  address public issuer; // the creator of the bounty

  address public arbiter; // should mediate conflicts, has the power to accept work

  BountyStages public bountyStage; // the stage of the bounty

  uint public deadline; // unix timestamp before which all work must be submitted
  string public data; // a hash of data representing the requirements for each milestone of the bounty, along with any associated files

  uint[] public fulfillmentAmounts; // the amount of wei to be rewarded to the user who fulfills the i'th milestone
  uint public totalFulfillmentAmounts; // the sum of the payouts for the various milestones

  mapping(uint=>Fulfillment[]) public fulfillments; // all submitted fulfillments for each milestone

  mapping(uint=>uint) public numAccepted; // the number of accepted fulfillments for each milestone
  mapping(uint=>uint) public numPaid; // the number of paid fulfillments for each milestone

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

  struct Fulfillment {
      bool paid;
      bool accepted;
      address fulfiller;
      string data;
  }

  /*
   * Modifiers
   */

  modifier onlyIssuer() {
      require(msg.sender == issuer);
      _;
  }
  modifier onlyIssuerOrArbiter() {
      require(msg.sender == issuer || (msg.sender == arbiter && arbiter != address(0)));
      _;
  }
  modifier notIssuerOrArbiter() {
      require(msg.sender != issuer && msg.sender != arbiter);
      _;
  }

  modifier onlyFulfiller( uint _milestoneId, uint _fulfillmentId) {
      require(msg.sender == fulfillments[_milestoneId][_fulfillmentId].fulfiller);
      _;
  }
   modifier amountIsNotZero(uint amount) {
      require(amount != 0);
      _;
  }
  modifier amountsNotZeroAndEqualSum(uint[] amounts, uint _sum) {
      uint sum = 0;
      uint oldSum = 0;
      for (uint i = 0; i < amounts.length; i++){
          oldSum = sum;
          sum = oldSum + amounts[i];
          require(sum > oldSum);
      }
      require (sum == _sum);
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


  modifier isNotDead() {
      require(bountyStage != BountyStages.Dead);
      _;
  }

  modifier validateFulfillmentArrayIndex(uint _milestoneId, uint _index) {
      require(_index < fulfillments[_milestoneId].length);
      _;
  }

  modifier validateMilestoneIndex(uint _milestoneId){
      require(_milestoneId < fulfillmentAmounts.length);
      _;
  }

  modifier fulfillmentNotYetAccepted(uint _milestoneId, uint _fulfillmentId) {
      require(fulfillments[_milestoneId][_fulfillmentId].accepted == false);
      _;
  }

  modifier checkFulfillmentIsApprovedAndUnpaid( uint _milestoneId, uint _fulfillmentId) {
      require(fulfillments[_milestoneId][_fulfillmentId].accepted && !fulfillments[_milestoneId][_fulfillmentId].paid);
      _;
  }

  modifier validateFunding() {

      uint total = 0;
      for (uint i = 0 ; i < fulfillmentAmounts.length; i++){
          total = total +  fulfillmentAmounts[i];
      }

      require (this.balance >= (total + unpaidAmount()));
      _;
  }

  modifier unpaidAmountRemains(uint _milestoneId) {
      require((unpaidAmount() + fulfillmentAmounts[_milestoneId]) <= this.balance);
      _;
  }

  modifier notYetAccepted( uint _milestoneId, uint _fulfillmentId){
    require(fulfillments[_milestoneId][_fulfillmentId].accepted == false);
    _;
  }

  /*
   * Public functions
   */

  /// @dev StandardBounty(): instantiates a new draft bounty
  /// @param _issuer the address of the intended issuer of the bounty
  /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
  /// @param _data the requirements of the bounty
  /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
  /// @param _totalFulfillmentAmounts the sum of the individual fulfillment amounts
  /// @param _arbiter the address of the arbiter who can mediate claims
  function StandardBounty(
      address _issuer,
      uint _deadline,
      string _data,
      uint256[] _fulfillmentAmounts,
      uint _totalFulfillmentAmounts,
      address _arbiter
  )
      amountsNotZeroAndEqualSum(_fulfillmentAmounts, _totalFulfillmentAmounts)
      validateDeadline(_deadline)
  {
      issuer = _issuer;
      bountyStage = BountyStages.Draft;
      deadline = _deadline;
      data = _data;
      arbiter = _arbiter;
      fulfillmentAmounts = _fulfillmentAmounts;
      totalFulfillmentAmounts = _totalFulfillmentAmounts;
  }

  /// @dev contribute(): a function allowing anyone to contribute ether to a
  /// bounty, as long as it is still before its deadline. Shouldn't keep
  /// ether by accident (hence 'value').
  /// @param value the amount being contributed in ether to prevent accidental deposits
  /// @notice Please note you funds will be at the mercy of the issuer
  ///  and can be drained at any moment. Be careful!
  function contribute (uint value)
      payable
      isBeforeDeadline
      isNotDead
      amountIsNotZero(value)
      amountEqualsValue(value)
  {
      ContributionAdded(msg.sender, value);
  }

  /// @notice Send funds to activate the bug bounty
  /// @dev activateBounty(): activate a bounty so it may pay out
  /// @param value the amount being contributed in ether to prevent
  /// accidental deposits
  function activateBounty(uint value)
      payable
      public
      isBeforeDeadline
      onlyIssuer
      amountEqualsValue(value)
      validateFunding
  {
      transitionToState(BountyStages.Active);

      ContributionAdded(msg.sender, msg.value);
      BountyActivated(msg.sender);
  }

  /// @dev fulfillBounty(): submit a fulfillment for the given bounty
  /// @param _data the data artifacts representing the fulfillment of the bounty
  /// @param _milestoneId the id of the milestone being fulfilled
  function fulfillBounty(string _data, uint _milestoneId)
      public
      isAtStage(BountyStages.Active)
      isBeforeDeadline
      validateMilestoneIndex(_milestoneId)
      notIssuerOrArbiter
  {
      fulfillments[_milestoneId].push(Fulfillment(false, false, msg.sender, _data));

      BountyFulfilled(msg.sender, (fulfillments[_milestoneId].length - 1), _milestoneId);
  }

  /// @dev updateFulfillment(): Submit updated data for a given fulfillment
  /// @param _data the new data being submitted
  /// @param _milestoneId the index of the milestone
  /// @param _fulfillmentId the index of the fulfillment
  function updateFulfillment(string _data, uint _milestoneId, uint _fulfillmentId)
  public
  validateMilestoneIndex(_milestoneId)
  validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
  onlyFulfiller(_milestoneId, _fulfillmentId)
  notYetAccepted(_milestoneId, _fulfillmentId)
  {
    fulfillments[_milestoneId][_fulfillmentId].data = _data;
  }

  /// @dev acceptFulfillment(): accept a given fulfillment
  /// @param _fulfillmentId the index of the fulfillment being accepted
  /// @param _milestoneId the id of the milestone being accepted
  function acceptFulfillment( uint _milestoneId, uint _fulfillmentId)
      public
      onlyIssuerOrArbiter
      isAtStage(BountyStages.Active)
      validateMilestoneIndex(_milestoneId)
      validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
      fulfillmentNotYetAccepted(_milestoneId, _fulfillmentId)
      unpaidAmountRemains(_milestoneId)
  {
      fulfillments[_milestoneId][_fulfillmentId].accepted = true;
      numAccepted[_milestoneId]++;

      FulfillmentAccepted(msg.sender, _milestoneId, _fulfillmentId);
  }

  /// @dev fulfillmentPayment(): pay the fulfiller for their work
  /// @param _fulfillmentId the index of the fulfillment being accepted
  /// @param _milestoneId the id of the milestone being paid
  function fulfillmentPayment( uint _milestoneId, uint _fulfillmentId)
      public
      validateMilestoneIndex(_milestoneId)
      validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
      onlyFulfiller(_milestoneId, _fulfillmentId)
      checkFulfillmentIsApprovedAndUnpaid(_milestoneId, _fulfillmentId)
  {
      fulfillments[_milestoneId][_fulfillmentId].paid = true;
      numPaid[_milestoneId]++;
      fulfillments[_milestoneId][_fulfillmentId].fulfiller.transfer(fulfillmentAmounts[_milestoneId]);

      FulfillmentPaid(msg.sender, _milestoneId, _fulfillmentId);
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

  /// @dev transferIssuer(): allows the issuer to transfer ownership of the
  /// bounty to some new address
  /// @param _newIssuer the address of the new issuer
  function transferIssuer(address _newIssuer)
  public
  onlyIssuer
  {
    issuer = _newIssuer;
  }

  /// @dev changeBounty(): allows the issuer to change all bounty storage
  /// members simultaneously
  /// @param _issuer the new address of the issuer
  /// @param _newDeadline the new deadline for the bounty
  /// @param _newData the new requirements of the bounty
  /// @param _newFulfillmentAmounts the new fulfillment amounts
  /// @param _totalFulfillmentAmounts the sum of the individual fulfillment amounts
  /// @param _newArbiter the new address of the arbiter
  function changeBounty(address _issuer,
                        uint _newDeadline,
                        string _newData,
                        uint[] _newFulfillmentAmounts,
                        uint _totalFulfillmentAmounts,
                        address _newArbiter)
      public
      onlyIssuer
      validateDeadline(_newDeadline)
      amountsNotZeroAndEqualSum(_newFulfillmentAmounts, _totalFulfillmentAmounts)
      isAtStage(BountyStages.Draft)
  {
    issuer = _issuer;
    deadline = _newDeadline;
    data = _newData;
    fulfillmentAmounts = _newFulfillmentAmounts;
    totalFulfillmentAmounts = _totalFulfillmentAmounts;
    arbiter = _newArbiter;
  }



  /// @dev getFulfillment(): Returns the fulfillment at a given index
  /// @param _fulfillmentId the index of the fulfillment to return
  /// @param _milestoneId the index of the milestone to return
  /// @return Returns a tuple for the fulfillment
  function getFulfillment( uint _milestoneId, uint _fulfillmentId)
      public
      constant
      validateMilestoneIndex(_milestoneId)
      validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
      returns (bool, bool, address, string)
  {
      return (fulfillments[_milestoneId][_fulfillmentId].paid,
              fulfillments[_milestoneId][_fulfillmentId].accepted,
              fulfillments[_milestoneId][_fulfillmentId].fulfiller,
              fulfillments[_milestoneId][_fulfillmentId].data);
  }

  /// @dev getBounty(): Returns the details of the bounty
  /// @return Returns a tuple for the bounty
  function getBounty()
      public
      constant
      returns (address, uint, uint, string)
  {
      return (issuer,
              uint(bountyStage),
              deadline,
              data);
  }

  /// @dev getNumFulfillments() returns the number of fulfillments for a given milestone
  /// @param _milestoneId the ID of the milestone
  /// @return Returns the number of fulfillments
  function getNumFulfillments(uint _milestoneId)
      public
      constant
      validateMilestoneIndex(_milestoneId)
      returns (uint)
  {
      return fulfillments[_milestoneId].length;
  }
  /// @dev getNumMilestones() returns the number of milestones
  /// @return Returns the number of fulfillments
  function getNumMilestones()
      public
      constant
      returns (uint)
  {
      return fulfillmentAmounts.length;
  }

  /// @dev unpaidAmount(): calculates the amount which
  /// the bounty has yet to pay out
  /// @return Returns the amount of Wei or tokens owed
  function unpaidAmount()
      public
      constant
      returns (uint amount)
  {
      for (uint i = 0; i < fulfillmentAmounts.length; i++){
          amount = (amount + (fulfillmentAmounts[i]* (numAccepted[i]- numPaid[i])));
      }
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
