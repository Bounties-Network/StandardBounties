pragma solidity ^0.4.11;

import "./SafeMath.sol";

/// @title StandardBounty
/// @dev Used to pay out individuals or groups for task fulfillment through
/// stepwise work submission, acceptance, and payment
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounty {

  uint constant public MAX_FULFILLMENTS = 254;

  /*
   * Events
   */

  event BountyActivated(address issuer);
  event BountyFulfilled(address indexed fulfiller, uint256 indexed _fulfillmentId, uint256 indexed _milestoneId);
  event FulfillmentAccepted(address indexed fulfiller, uint256 indexed _fulfillmentId, uint256 indexed _milestoneId);
  event FulfillmentPaid(address indexed fulfiller, uint256 indexed _fulfillmentId, uint256 indexed _milestoneId);
  event BountyKilled();
  event ContributionAdded(address indexed contributor, uint256 value);
  event DeadlineExtended(uint newDeadline);

  /*
   * Storage
   */

  address public issuer; // the creator of the bounty
  string public issuerContact; // string of a contact method used to reach the issuer in case it is needed

  address public arbiter; // should mediate conflicts, has the power to accept work

  BountyStages public bountyStage; // the stage of the bounty

  uint public deadline; // unix timestamp before which all work must be submitted
  string public data; // a hash of data representing the requirements for each milestone of the bounty, along with any associated files

  uint public numMilestones; // the total number of milestones
  uint[] public fulfillmentAmounts; // the amount of wei to be rewarded to the user who fulfills the i'th milestone
  uint public totalFulfillmentAmounts; // the sum of the payouts for the various milestones

  mapping(uint=>Fulfillment[]) public fulfillments; // all submitted fulfillments for each milestone
  mapping(uint=>uint) public numFulfillments; // the number of submitted fulfillments for each milestone

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
      string dataType;
  }

  /*
   * Modifiers
   */

  modifier onlyIssuer() {
      require(msg.sender == issuer);
      _;
  }
  modifier onlyIssuerOrArbiter() {
      require(msg.sender == issuer || msg.sender == arbiter);
      _;
  }
  modifier notIssuerOrArbiter() {
      require(msg.sender != issuer && msg.sender != arbiter);
      _;
  }

  modifier onlyFulfiller(uint _fulfillmentId, uint _milestoneId) {
      require(msg.sender == fulfillments[_milestoneId][_fulfillmentId].fulfiller);
      _;
  }
   modifier amountIsNotZero(uint amount) {
      require(amount != 0);
      _;
  }
  modifier amountsNotZeroAndEqualSum(uint[] amounts, uint _sum) {
      uint sum = 0;
      for (uint i = 0; i < amounts.length; i++){
          sum = SafeMath.add(sum,amounts[i]);
          require(amounts[i] != 0);
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

  modifier checkFulfillmentsNumber(uint _milestoneId) {
      require(numFulfillments[_milestoneId] < MAX_FULFILLMENTS);
      _;
  }

  modifier validateFulfillmentArrayIndex(uint index, uint _milestoneId) {
      require(index < numFulfillments[_milestoneId]);
      _;
  }

  modifier validateMilestoneIndex(uint _milestoneId){
      require(_milestoneId < numMilestones);
      _;
  }

  modifier checkFulfillmentIsApprovedAndUnpaid(uint _fulfillmentId, uint _milestoneId) {
      require(fulfillments[_milestoneId][_fulfillmentId].accepted && !fulfillments[_milestoneId][_fulfillmentId].paid);
      _;
  }


  modifier validateFunding() {

      uint total = 0;
      for (uint i = 0 ; i < numMilestones; i++){
          total = SafeMath.add(total, fulfillmentAmounts[i]);
      }

      require (this.balance >= SafeMath.add(total, unpaidAmount()));
      _;
  }

  modifier correctLengths(uint _numMilestones, uint _length) {
      require(_numMilestones == _length);
      _;
  }

  modifier unpaidAmountRemains(uint _milestoneId) {
      require(SafeMath.add(unpaidAmount(), fulfillmentAmounts[_milestoneId]) <= this.balance);
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
  /// @param _arbiter the address of the arbiter who can mediate claims
  function StandardBounty(
      uint _deadline,
      string _contactInfo,
      string _data,
      uint256[] _fulfillmentAmounts,
      uint _totalFulfillmentAmounts,
      uint _numMilestones,
      address _arbiter
  )
      amountsNotZeroAndEqualSum(_fulfillmentAmounts, _totalFulfillmentAmounts)
      validateDeadline(_deadline)
      correctLengths(_numMilestones, _fulfillmentAmounts.length)
  {
      issuer = tx.origin; //this allows for the issuance of a bounty using a factory
      issuerContact = _contactInfo;
      bountyStage = BountyStages.Draft;
      deadline = _deadline;
      data = _data;
      numMilestones = _numMilestones;
      arbiter = _arbiter;

      fulfillmentAmounts = _fulfillmentAmounts;
      totalFulfillmentAmounts = _totalFulfillmentAmounts;
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
      isNotDead
      amountIsNotZero(value)
      amountEqualsValue(value)
  {
      ContributionAdded(msg.sender, msg.value);
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
  /// @param _dataType a meaningful description of the type of data the fulfillment represents
  /// @param _milestoneId the id of the milestone being fulfilled
  function fulfillBounty(string _data, string _dataType, uint _milestoneId)
      public
      isAtStage(BountyStages.Active)
      isBeforeDeadline
      validateMilestoneIndex(_milestoneId)
      checkFulfillmentsNumber(_milestoneId)
      notIssuerOrArbiter
  {
      fulfillments[_milestoneId].push(Fulfillment(false, false, msg.sender, _data, _dataType));

      BountyFulfilled(msg.sender, numFulfillments[_milestoneId]++, _milestoneId);
  }

  /// @dev acceptFulfillment(): accept a given fulfillment
  /// @param _fulfillmentId the index of the fulfillment being accepted
  /// @param _milestoneId the id of the milestone being accepted
  function acceptFulfillment(uint _fulfillmentId, uint _milestoneId)
      public
      onlyIssuerOrArbiter
      isAtStage(BountyStages.Active)
      validateMilestoneIndex(_milestoneId)
      validateFulfillmentArrayIndex(_fulfillmentId, _milestoneId)
      unpaidAmountRemains(_milestoneId)
  {
      fulfillments[_milestoneId][_fulfillmentId].accepted = true;
      numAccepted[_milestoneId]++;

      FulfillmentAccepted(msg.sender, _fulfillmentId, _milestoneId);
  }

  /// @dev fulfillmentPayment(): pay the fulfiller for their work
  /// @param _fulfillmentId the index of the fulfillment being accepted
  /// @param _milestoneId the id of the milestone being paid
  function fulfillmentPayment(uint _fulfillmentId, uint _milestoneId)
      public
      validateMilestoneIndex(_milestoneId)
      validateFulfillmentArrayIndex(_fulfillmentId, _milestoneId)
      onlyFulfiller(_fulfillmentId, _milestoneId)
      checkFulfillmentIsApprovedAndUnpaid(_fulfillmentId, _milestoneId)
  {
      fulfillments[_milestoneId][_fulfillmentId].fulfiller.transfer(fulfillmentAmounts[_milestoneId]);
      fulfillments[_milestoneId][_fulfillmentId].paid = true;

      numPaid[_milestoneId]++;

      FulfillmentPaid(msg.sender, _fulfillmentId, _milestoneId);
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
  /// @param _newDeadline the new deadline for the bounty
  /// @param _newContactInfo the new contact information for the issuer
  /// @param _newData the new requirements of the bounty
  /// @param _newFulfillmentAmounts the new fulfillment amounts
  /// @param _newNumMilestones the number of milestones which can be fulfilled
  function changeBounty(uint _newDeadline,
                        string _newContactInfo,
                        string _newData,
                        uint[] _newFulfillmentAmounts,
                        uint _totalFulfillmentAmounts,
                        uint _newNumMilestones,
                        address _newArbiter)
      public
      onlyIssuer
      validateDeadline(_newDeadline)
      amountsNotZeroAndEqualSum(_newFulfillmentAmounts, _totalFulfillmentAmounts)
      correctLengths(_newNumMilestones, _newFulfillmentAmounts.length)
      isAtStage(BountyStages.Draft)
  {
    deadline = _newDeadline;
    issuerContact = _newContactInfo;
    data = _newData;
    fulfillmentAmounts = _newFulfillmentAmounts;
    totalFulfillmentAmounts = _totalFulfillmentAmounts;
    numMilestones = _newNumMilestones;
    arbiter = _newArbiter;
  }

  /// @dev changeDeadline(): allows the issuer to change the deadline of the bounty
  /// @param _newDeadline the new deadline
  function changeDeadline(uint _newDeadline)
      public
      onlyIssuer
      validateDeadline(_newDeadline)
      isAtStage(BountyStages.Draft)
  {
      deadline = _newDeadline;
  }

  /// @dev changeData(): allows the issuer to change the data of the bounty
  /// @param _newData the new data
  function changeData(string _newData)
      public
      onlyIssuer
      isAtStage(BountyStages.Draft)
  {
      data = _newData;
  }

  /// @dev changeContact(): allows the issuer to change the contact of the bounty
  /// @param _newContact the new data
  function changeContact(string _newContact)
      public
      onlyIssuer
      isAtStage(BountyStages.Draft)
  {
      issuerContact = _newContact;
  }

  /// @dev changeArbiter(): allows the issuer to change the arbiter of the bounty
  /// @param _newArbiter the new data
  function changeArbiter(address _newArbiter)
      public
      onlyIssuer
      isAtStage(BountyStages.Draft)
  {
      arbiter = _newArbiter;
  }

  /// @dev changeFulfillmentAmounts(): allows the issuer to change the
  /// fulfillment amounts of the bounty
  /// @param _newFulfillmentAmounts the new fulfillment amounts
  /// @param _numMilestones the number of milestones which can be fulfilled
  function changeFulfillmentAmounts(uint[] _newFulfillmentAmounts, uint _totalFulfillmentAmounts, uint _numMilestones)
      public
      onlyIssuer
      amountsNotZeroAndEqualSum(_newFulfillmentAmounts, _totalFulfillmentAmounts)
      correctLengths(_numMilestones, _newFulfillmentAmounts.length)
      isAtStage(BountyStages.Draft)
  {
      fulfillmentAmounts = _newFulfillmentAmounts;
      numMilestones = _numMilestones;
      totalFulfillmentAmounts = _totalFulfillmentAmounts;
  }

  /// @dev getFulfillment(): Returns the fulfillment at a given index
  /// @param _fulfillmentId the index of the fulfillment to return
  /// @param _milestoneId the index of the milestone to return
  /// @return Returns a tuple for the fulfillment
  function getFulfillment(uint _fulfillmentId, uint _milestoneId)
      public
      constant
      validateMilestoneIndex(_milestoneId)
      validateFulfillmentArrayIndex(_fulfillmentId, _milestoneId)
      returns (bool, bool, address, string, string)
  {
      return (fulfillments[_milestoneId][_fulfillmentId].paid,
              fulfillments[_milestoneId][_fulfillmentId].accepted,
              fulfillments[_milestoneId][_fulfillmentId].fulfiller,
              fulfillments[_milestoneId][_fulfillmentId].data,
              fulfillments[_milestoneId][_fulfillmentId].dataType);
  }

  /// @dev getBounty(): Returns the details of the bounty
  /// @return Returns a tuple for the bounty
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

  /// @dev unpaidAmount(): calculates the amount which
  /// the bounty has yet to pay out
  /// @return Returns the amount of Wei or tokens owed
  function unpaidAmount()
      public
      constant
      returns (uint amount)
  {
      for (uint i = 0; i < numMilestones; i++){
          amount = SafeMath.add(amount, SafeMath.mul(fulfillmentAmounts[i], SafeMath.sub(numAccepted[i], numPaid[i])));
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
