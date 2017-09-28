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
    require (tokenContract.balanceOf(this) >= (total + unpaidAmount()));

    _;
  }

  modifier unpaidAmountRemains(uint _milestoneId) {
      require((unpaidAmount() + fulfillmentAmounts[_milestoneId]) <= tokenContract.balanceOf(this));
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


    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param _fulfillmentId the index of the fulfillment being accepted
    /// @param _milestoneId the id of the milestone being paid
    function fulfillmentPayment(uint _milestoneId, uint _fulfillmentId)
    public
    validateMilestoneIndex(_milestoneId)
    validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
    onlyFulfiller(_milestoneId, _fulfillmentId)
    checkFulfillmentIsApprovedAndUnpaid(_milestoneId, _fulfillmentId)
    {
      fulfillments[_milestoneId][_fulfillmentId].paid = true;
      numPaid[_milestoneId]++;
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
      tokenContract.transfer(issuer, tokenContract.balanceOf(this) - unpaidAmount());

      transitionToState(BountyStages.Dead);

      BountyKilled();
    }

    /// @dev changeBounty(): allows the issuer to change all bounty storage
    /// members simultaneously
    /// @param _newIssuer the new address of the issuer
    /// @param _newDeadline the new deadline for the bounty
    /// @param _newData the new requirements of the bounty
    /// @param _newFulfillmentAmounts the new fulfillment amounts
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
      totalFulfillmentAmounts = _totalFulfillmentAmounts;
      arbiter = _newArbiter;
      tokenContract = HumanStandardToken(_tokenAddress);
    }

  }
