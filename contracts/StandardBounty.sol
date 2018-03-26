pragma solidity ^0.4.18;
import "./inherited/StandardToken.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment

contract StandardBounty {

  /*
   * Storage
   */

  address public masterCopy;

  address public controller;
  string public data;

  bool public hasPaidOut;

  Fulfillment[] public fulfillments;

  Contribution[] public contributions;



  /*
   * Events
   */
  event BountyFulfilled(uint256 _fulfillmentId);
  event FulfillmentUpdated(uint _fulfillmentId);
  event FulfillmentAccepted(uint256 _fulfillmentId);
  event BountyDrained(address controller);
  event BountyChanged();

  /*
   * Structs
   */
  struct Fulfillment {
      address[] fulfillers;
      uint[] numerators;
      uint denomenator;
      string data;
      bool accepted;
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

  modifier onlyController() {
      require(msg.sender == controller);
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

  modifier notController(address _fulfiller) {
      require(_fulfiller != controller);
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

  modifier fulfillmentNotYetAccepted(uint _fulfillmentId){
      require(!fulfillments[_fulfillmentId].accepted);
      _;
  }

  modifier sameLength(uint l1, uint l2){
      require(l1 == l2);
      _;
  }

  modifier sumToOne(uint[] _numerators, uint _denomenator){
      uint sum = 0;
      for (uint i = 0; i < _numerators.length; i++){
        sum += _numerators[i];
      }
      require(sum == _denomenator);
      _;
  }


  /*
   * Public functions
   */

  function ()
  public
  payable
  {

  }

  function initializeBounty(
      address _controller,
      string _data)
      public
  {
    require(controller == address(0));
    require(_controller != address(0));
    // an controller of a bounty is only 0x0 when it is uninitialized,
    // so this check prevents initialization from being called multiple times

    controller = _controller;
    data = _data;

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

  function fulfillBounty(address[] _fulfillers, uint[] _numerators, uint _denomenator, string _data)
      public
      validateNotTooManyFulfillments
      sameLength(_fulfillers.length, _numerators.length)
      sumToOne(_numerators, _denomenator)
  {
      fulfillments.push(Fulfillment(_fulfillers, _numerators, _denomenator, _data, false));

      BountyFulfilled((fulfillments.length - 1));
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
  }

  function acceptFulfillment(uint _fulfillmentId, StandardToken[] _payoutTokens, uint[] _tokenAmounts)
      public
      validateFulfillmentArrayIndex(_fulfillmentId)
      sameLength(_payoutTokens.length, _tokenAmounts.length)
      onlyController
  {
      hasPaidOut = true;
      Fulfillment storage fulfillment = fulfillments[_fulfillmentId];
      for (uint256 i = 0; i < _payoutTokens.length; i++){
        for (uint256 j = 0; j < fulfillment.fulfillers.length; j++){
          if (_payoutTokens[i] == address(0)){
            require(this.balance >= _tokenAmounts[i]);
            fulfillment.fulfillers[j].transfer(calculateFraction(_tokenAmounts[i], fulfillment.numerators[j], fulfillment.denomenator));
          } else {
            require(_payoutTokens[i].balanceOf(this) >= _tokenAmounts[i]);
            require(_payoutTokens[i].transfer(fulfillment.fulfillers[j], calculateFraction(_tokenAmounts[i], fulfillment.numerators[j], fulfillment.denomenator)));
          }
        }
      }

      FulfillmentAccepted(_fulfillmentId);
  }

  function acceptAndFulfill(address[] _fulfillers, uint[] _numerators, uint _denomenator, string _data, StandardToken[] _payoutTokens, uint[] _tokenAmounts)
      public
      sameLength(_payoutTokens.length, _tokenAmounts.length)
      onlyController
  {
      fulfillBounty(_fulfillers, _numerators, _denomenator, _data);
      hasPaidOut = true;
      Fulfillment storage fulfillment = fulfillments[fulfillments.length - 1];
      for (uint256 i = 0; i < _payoutTokens.length; i++){
        for (uint256 j = 0; j < fulfillment.fulfillers.length; j++){
          if (_payoutTokens[i] == address(0)){
            require(this.balance >= _tokenAmounts[i]);
            fulfillment.fulfillers[j].transfer(calculateFraction(_tokenAmounts[i], fulfillment.numerators[j], fulfillment.denomenator));
          } else {
            require(_payoutTokens[i].balanceOf(this) >= _tokenAmounts[i]);
            require(_payoutTokens[i].transfer(fulfillment.fulfillers[j], calculateFraction(_tokenAmounts[i], fulfillment.numerators[j], fulfillment.denomenator)));
          }
        }
      }

      FulfillmentAccepted(fulfillments.length - 1);
  }

  function drainBounty(StandardToken[] _payoutTokens)
      public
      onlyController
  {
    for (uint256 i = 0; i < _payoutTokens.length; i++){
      uint toPay;
      if (_payoutTokens[i] == address(0x0)){
        toPay = this.balance;
        controller.transfer(toPay);

      } else {
        toPay = _payoutTokens[i].balanceOf(this);
        require(_payoutTokens[i].transfer(controller, toPay));
      }
    }
      BountyDrained(msg.sender);
  }

  function changeBounty(address _controller, string _data)
      public
      onlyController
  {
      controller = _controller;
      data = _data;
      BountyChanged();
  }

  function changeController(address _controller)
      public
      onlyController
  {
      controller = _controller;
      BountyChanged();
  }

  function changeData(string _data)
      public
      onlyController
  {
      data = _data;
      BountyChanged();
  }

  function changeMasterCopy(StandardBounty _masterCopy)
        public
        onlyController
    {
        require(address(_masterCopy) != 0);
        masterCopy = _masterCopy;
    }

  function getBounty()
        public
        constant
        returns (address, string, bool, uint)
    {
        return (controller,
                data,
                hasPaidOut,
                fulfillments.length);
    }

    function getFulfillment(uint _fulfillmentId)
          public
          constant
          returns (address[], uint[], uint, string, bool)
      {
          return (fulfillments[_fulfillmentId].fulfillers,
                  fulfillments[_fulfillmentId].numerators,
                  fulfillments[_fulfillmentId].denomenator,
                  fulfillments[_fulfillmentId].data,
                  fulfillments[_fulfillmentId].accepted);
      }
}
