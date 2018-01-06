pragma solidity ^0.4.19;
import "./inherited/StandardToken.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment

contract StandardBounty {

  /*
   * Storage
   */

  address public masterCopy;

  address public issuer;
  string public data;
  address public arbiter;

  bool public hasPaidOut;

  Fulfillment[] public fulfillments;

  Contribution[] public contributions;



  /*
   * Events
   */
  event BountyFulfilled(address fulfiller, uint256 _fulfillmentId);
  event FulfillmentUpdated(uint _fulfillmentId);
  event FulfillmentAccepted(address fulfiller, uint256 _fulfillmentId);
  event BountyDrained(address issuer);
  event BountyChanged();

  /*
   * Structs
   */
  struct Fulfillment {
      address fulfiller;
      string data;
  }

  struct Contribution {
      address contributor;
      uint[] amounts;
      StandardToken[] tokens;
      bool refunded;
      mapping (address => bool) hasContributed;
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

  modifier onlyFulfiller(uint _fulfillmentId) {
      require(msg.sender == fulfillments[_fulfillmentId].fulfiller);
      _;
  }

  modifier validateFulfillmentArrayIndex(uint _index) {
      require(_index < fulfillments.length);
      _;
  }

  modifier validateNotTooManyFulfillments(){
    require((fulfillments.length + 1) > fulfillments.length);
    _;
  }

  modifier notIssuerOrArbiter() {
      require(msg.sender != issuer);
      _;
  }

  modifier hasNotPaid(){
      require(!hasPaidOut);
      _;
  }

  modifier onlyContributor(uint _contributionId){
      require(contributions[_contributionId].contributor == msg.sender);
      _;
  }

  modifier notYetRefunded(uint _contributionId){
      require(!contributions[_contributionId].refunded);
      _;
  }

  /*
   * Public functions
   */

  function StandardBounty(
    address _issuer,
    string _data,
    address _arbiter)
    public
  {
    initializeBounty(_issuer, _data, _arbiter);
  }

  function initializeBounty(
      address _issuer,
      string _data,
      address _arbiter)
      public
  {
    require(issuer == address(0));
    require(_issuer != address(0));
    // an issuer of a bounty is only 0x0 when it is uninitialized,
    // so this check prevents initialization from being called multiple times

    issuer = _issuer;
    data = _data;
    arbiter = _arbiter;
  }

  function refundableContribute(uint[] _amounts, StandardToken[] _tokens)
  public
  payable
  {
      require(_amounts.length == _tokens.length);

      contributions.push(Contribution(msg.sender, _amounts, _tokens, false));
      uint contributionId = contributions.length - 1;
      for (uint i = 0; i < _amounts.length; i++){
          require(!contributions[contributionId].hasContributed[_tokens[i]]);
          contributions[contributionId].hasContributed[_tokens[i]] = true;
          if (_tokens[i] == address(0)){
              require(msg.value == _amounts[i]);
          } else {
              require(_tokens[i].transferFrom(msg.sender, this, _amounts[i]));
          }
      }
  }

  function refundContribution(uint _contributionId)
  public
  payable
  hasNotPaid
  onlyContributor(_contributionId)
  notYetRefunded(_contributionId)
  {
      contributions[_contributionId].refunded = true;
      for (uint i = 0; i < contributions[_contributionId].amounts.length; i++){
          if (contributions[_contributionId].tokens[i] == address(0)){
              contributions[_contributionId].contributor.transfer(contributions[_contributionId].amounts[i]);
          } else {
              require(contributions[_contributionId].tokens[i].transfer(contributions[_contributionId].contributor, contributions[_contributionId].amounts[i]));
          }
      }
  }

  function fulfillBounty(address _fulfiller, string _data)
      public
      validateNotTooManyFulfillments
      notIssuerOrArbiter
  {
      fulfillments.push(Fulfillment(_fulfiller, _data));

      BountyFulfilled(_fulfiller, (fulfillments.length - 1));
  }

  function updateFulfillment(uint _fulfillmentId, string _data)
      public
      validateFulfillmentArrayIndex(_fulfillmentId)
      onlyFulfiller(_fulfillmentId)
  {
      fulfillments[_fulfillmentId].data = _data;
      FulfillmentUpdated(_fulfillmentId);
  }

  function calculateFraction(uint _balance, uint _numerator, uint _denomenator)
      public
      pure
      returns (uint newBalanceDiv)
  {
    require(_denomenator != 0);

    //first multiplies by the numerator
    uint newBalanceMult = _balance * _numerator;
    require(newBalanceMult / _numerator == _balance);

    //secondly divides by the denomenator
    newBalanceDiv = newBalanceMult / _denomenator;
    require(newBalanceMult == newBalanceDiv * _denomenator + newBalanceMult % _denomenator);
  }

  function acceptFulfillment(uint _fulfillmentId, uint _numerator, uint _denomenator, StandardToken[] _payoutTokens)
      public
      validateFulfillmentArrayIndex(_fulfillmentId)
      onlyIssuerOrArbiter
  {
      hasPaidOut = true;
      for (uint256 i = 0; i < _payoutTokens.length; i++){
        uint toPay;
        if (_payoutTokens[i] == address(0x0)){
          toPay = this.balance;
          toPay = calculateFraction(toPay, _numerator, _denomenator);
          fulfillments[_fulfillmentId].fulfiller.transfer(toPay);

        } else {
          toPay = _payoutTokens[i].balanceOf(this);
          toPay = calculateFraction(toPay, _numerator, _denomenator);
          require(_payoutTokens[i].transfer(fulfillments[_fulfillmentId].fulfiller, toPay));
        }
      }
      FulfillmentAccepted(msg.sender, _fulfillmentId);
  }

  function drainBounty(StandardToken[] _payoutTokens)
      public
      onlyIssuer
  {
    for (uint256 i = 0; i < _payoutTokens.length; i++){
      uint toPay;
      if (_payoutTokens[i] == address(0x0)){
        toPay = this.balance;
        issuer.transfer(toPay);

      } else {
        toPay = _payoutTokens[i].balanceOf(this);
        require(_payoutTokens[i].transfer(issuer, toPay));
      }
    }
      BountyDrained(msg.sender);
  }

  function changeBounty(address _issuer, address _arbiter, string _data)
      public
      onlyIssuer
  {
      issuer = _issuer;
      arbiter = _arbiter;
      data = _data;
      BountyChanged();
  }

  function changeIssuer(address _issuer)
      public
      onlyIssuer
  {
      issuer = _issuer;
      BountyChanged();
  }

  function changeArbiter(address _arbiter)
      public
      onlyIssuer
  {
      arbiter = _arbiter;
      BountyChanged();
  }

  function changeData(string _data)
      public
      onlyIssuer
  {
      data = _data;
      BountyChanged();
  }

  function changeMasterCopy(StandardBounty _masterCopy)
        public
        onlyIssuer
    {
        require(address(_masterCopy) != 0);
        masterCopy = _masterCopy;
    }

  function getBounty()
        public
        constant
        returns (address, address, string, Fulfillment[], bool)
    {
        return (issuer,
                arbiter,
                data,
                fulfillments,
                hasPaidOut);
    }
}
