pragma solidity ^0.4.19;
import "./inherited/StandardToken.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment

contract StandardBounty {

  /*
   * Storage
   */

  address issuer;
  string data;
  address arbiter;

  Fulfillment[] fulfillments;

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

  /*
   * Public functions
   */


  function StandardBounty(
      address _issuer,
      string _data,
      address _arbiter
      )
      public
  {
    issuer = _issuer;
    data = _data;
    arbiter = _arbiter;
  }

  function fulfillBounty(address _fulfiller, string _data)
      public
      validateNotTooManyFulfillments()
      notIssuerOrArbiter()
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
      onlyIssuerOrArbiter()
  {
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
      onlyIssuer()
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
      onlyIssuer()
  {
      issuer = _issuer;
      arbiter = _arbiter;
      data = _data;
      BountyChanged();
  }

  function getBounty()
        public
        constant
        returns (address, address, string, Fulfillment[])
    {
        return (issuer,
                arbiter,
                data,
                fulfillments);
    }
}
