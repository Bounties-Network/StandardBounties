pragma solidity ^0.4.11;
import "./StandardBounty.sol";
import "./inherited/HumanStandardToken.sol";


/// @title TokenBounty
/// @dev Used to pay out individuals or groups in ERC20 tokens for task
/// fulfillment through stepwise work submission, acceptance, and payment
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
      if (value != 0){
        require(tokenContract.transferFrom(msg.sender, this, value));
      }
      require(tokenContract.balanceOf(this) >= value);
    _;
  }

  modifier validateFunding() {
    uint total = 0;
    for (uint i = 0 ; i < fulfillmentAmounts.length; i++){
      total = total + fulfillmentAmounts[i];
    }
    require (tokenContract.balanceOf(this) >= (total + amountToPay));

    _;
  }

  modifier amountToPayRemains(uint _milestoneId) {
      require((amountToPay + fulfillmentAmounts[_milestoneId]) <= tokenContract.balanceOf(this));
      _;
  }

  modifier unpaidAmountRemains(uint _milestoneId) {
      require((unpaidAmount + fulfillmentAmounts[_milestoneId]) <= tokenContract.balanceOf(this));
      _;
  }

  modifier fundsRemainToPayUnpaidAmounts(uint _difference){
      require(tokenContract.balanceOf(this) >= (unpaidAmount + _difference));
      _;
  }

  modifier fundsRemainForAmountToPay(uint _difference){
      require(tokenContract.balanceOf(this) >= (amountToPay + _difference));
      _;
  }



  /*
  * Public functions
  */

  /// @dev TokenBounty(): instantiates a new draft token bounty
  /// @param _issuer the address of the intended issuer of the bounty
  /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
  /// @param _data the requirements of the bounty
  /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
  /// @param _totalFulfillmentAmounts the sum of the individual fulfillment amounts
  /// @param _arbiter the address of the arbiter who can mediate claims
  /// @param _tokenAddress the address of the token contract
  function TokenBounty(
    address _issuer,
    uint _deadline,
    string _data,
    uint[] _fulfillmentAmounts,
    uint _totalFulfillmentAmounts,
    address _arbiter,
    address _tokenAddress
    )
    StandardBounty(
      _issuer,
      _deadline,
      _data,
      _fulfillmentAmounts,
      _totalFulfillmentAmounts,
      _arbiter
      )
  {
    tokenContract = StandardToken(_tokenAddress);
  }
  /// @dev contribute(): a function allowing anyone to contribute ether to a
  /// bounty, as long as it is still before its deadline. Shouldn't keep
  /// ether by accident (hence 'value').
  /// @param value the amount being contributed in ether to prevent accidental deposits
  /// @notice Please note you funds will be at the mercy of the issuer
  ///  and can be drained at any moment. Be careful!
  function contribute (uint value)
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


  /// @dev fulfillmentPayment(): accept a given fulfillment, and send
  /// the fulfiller their owed funds
  /// @param _milestoneId the id of the milestone being paid
  /// @param _fulfillmentId the index of the fulfillment being accepted
  function fulfillmentPayment(uint _milestoneId, uint _fulfillmentId)
  public
  validateMilestoneIndex(_milestoneId)
  validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
  onlyFulfiller(_milestoneId, _fulfillmentId)
  checkFulfillmentIsApprovedAndUnpaid(_milestoneId, _fulfillmentId)
  {
    fulfillments[_milestoneId][_fulfillmentId].paid = true;
    numPaid[_milestoneId]++;
    amountToPay -= fulfillmentAmounts[_milestoneId];

    tokenContract.transfer(fulfillments[_milestoneId][_fulfillmentId].fulfiller, fulfillmentAmounts[_milestoneId]);
    FulfillmentPaid(msg.sender, _milestoneId, _fulfillmentId);
  }

  /// @dev killBounty(): drains the contract of it's remaining
  /// funds, and moves the bounty into stage 3 (dead) since it was
  /// either killed in draft stage, or never accepted any fulfillments
  function killBounty()
  public
  onlyIssuer
  {
    tokenContract.transfer(issuer, tokenContract.balanceOf(this) - amountToPay);

    transitionToState(BountyStages.Dead);

    BountyKilled();
  }

  /// @dev changeBounty(): allows the issuer to change all bounty storage
  /// members simultaneously
  /// @param _newIssuer the new address of the issuer
  /// @param _newDeadline the new deadline for the bounty
  /// @param _newData the new requirements of the bounty
  /// @param _newFulfillmentAmounts the new fulfillment amounts
  /// @param _totalFulfillmentAmounts the sum of the new fulfillment amounts
  /// @param _tokenAddress the address of the token contract
  function changeBounty(address _newIssuer,
                        uint _newDeadline,
                        string _newData,
                        uint[] _newFulfillmentAmounts,
                        uint _totalFulfillmentAmounts,
                        address _newArbiter,
                        address _tokenAddress)
      public
      onlyIssuer
      validateDeadline(_newDeadline)
      amountsNotZeroAndEqualSum(_newFulfillmentAmounts, _totalFulfillmentAmounts)
      isAtStage(BountyStages.Draft)
  {
    issuer = _newIssuer;
    deadline = _newDeadline;
    data = _newData;
    fulfillmentAmounts = _newFulfillmentAmounts;
    arbiter = _newArbiter;
    tokenContract = HumanStandardToken(_tokenAddress);
  }

}
