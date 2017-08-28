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
      require(value  <= tokenContract.allowance(msg.sender, this));
      if (value != 0){
        require(tokenContract.transferFrom(msg.sender, this, value));
      }
      require(tokenContract.balanceOf(this) >= value);
    _;
  }

  modifier validateFunding() {
    uint total = 0;
    for (uint i = 0 ; i < numMilestones; i++){
      total = SafeMath.add(total,  fulfillmentAmounts[i]);
    }
    require (tokenContract.balanceOf(this) >= SafeMath.add(total, unpaidAmount()));

    _;
  }
  
  modifier unpaidAmountRemains(uint _milestoneId) {
      require(SafeMath.add(unpaidAmount(), fulfillmentAmounts[_milestoneId]) <= tokenContract.balanceOf(this));
      _;
  }



  /*
  * Public functions
  */

  /// @dev TokenBounty(): instantiates a new draft token bounty
  /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
  /// @param _contactInfo the contact information of the issuer
  /// @param _data the requirements of the bounty
  /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
  /// @param _numMilestones the total number of milestones which can be paid out
  /// @param _tokenAddress the address of the token contract
  function TokenBounty(
    uint _deadline,
    string _contactInfo,
    string _data,
    uint[] _fulfillmentAmounts,
    uint _totalFulfillmentAmounts,
    uint _numMilestones,
    address _arbiter,
    address _tokenAddress
    )
    StandardBounty(
      _deadline,
      _contactInfo,
      _data,
      _fulfillmentAmounts,
      _totalFulfillmentAmounts,
      _numMilestones,
      _arbiter
      )
  {
    tokenContract = StandardToken(_tokenAddress);
  }


    /// @dev acceptFulfillment(): accept a given fulfillment, and send
    /// the fulfiller their owed funds
    /// @param _fulfillmentId the index of the fulfillment being accepted
    /// @param _milestoneId the id of the milestone being paid
    function fulfillmentPayment(uint _fulfillmentId, uint _milestoneId)
    public
    validateFulfillmentArrayIndex(_fulfillmentId, _milestoneId)
    validateMilestoneIndex(_milestoneId)
    onlyFulfiller(_fulfillmentId, _milestoneId)
    checkFulfillmentIsApprovedAndUnpaid(_fulfillmentId, _milestoneId)
    {
      tokenContract.transfer(fulfillments[_milestoneId][_fulfillmentId].fulfiller, fulfillmentAmounts[_milestoneId]);
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
      tokenContract.transfer(issuer, tokenContract.balanceOf(this) - unpaidAmount());

      transitionToState(BountyStages.Dead);

      BountyKilled();
    }

    /// @dev changeBounty(): allows the issuer to change all bounty storage
    /// members simultaneously
    /// @param _newDeadline the new deadline for the bounty
    /// @param _newContactInfo the new contact information for the issuer
    /// @param _newData the new requirements of the bounty
    /// @param _newFulfillmentAmounts the new fulfillment amounts
    /// @param _newNumMilestones the number of milestones which can be fulfilled
    /// @param _tokenAddress the address of the token contract
    function changeBounty(uint _newDeadline,
                          string _newContactInfo,
                          string _newData,
                          uint[] _newFulfillmentAmounts,
                          uint _totalFulfillmentAmounts,
                          uint _newNumMilestones,
                          address _newArbiter,
                          address _tokenAddress)
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
      tokenContract = HumanStandardToken(_tokenAddress);
    }

  }
