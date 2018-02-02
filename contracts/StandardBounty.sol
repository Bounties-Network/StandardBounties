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
  event BountyFulfilled(address fulfiller, uint256 _fulfillmentId);
  event FulfillmentUpdated(uint _fulfillmentId);
  event FulfillmentAccepted(address fulfiller, uint256 _fulfillmentId);
  event BountyDrained(address controller);
  event BountyChanged();

  /*
   * Structs
   */
  struct Fulfillment {
      address fulfiller;
      string data;
      bool accepted;
  }

  struct Contribution {
      address contributor;
      uint amount;
      address token;
      bool refunded;
  }

  /*
   * Modifiers
   */

  modifier onlyController() {
      require(msg.sender == controller);
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

  /*
   * Public functions
   */

  function ()
  public
  payable
  {
    refundableContribute(msg.sender, msg.value, address(0));
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

  function receiveApproval(address _from, uint256 _amount, address _token, bytes _data) public {
    require(_data.length == 0);
    refundableContribute(_from, _amount, _token);
  }

  function refundableContribute(address _contributor, uint _amount, address _token)
    public
    payable
  {
      require(_amount > 0);
      if (_token == address(0)) {
          require(msg.value == _amount);
      } else {
          require(StandardToken(_token).transferFrom(msg.sender, this, _amount));
      }
      contributions.push(Contribution(_contributor, _amount, _token, false));
  }

  function refundContribution(uint _contributionId)
    public
    hasNotPaid
    onlyContributor(_contributionId)
    notYetRefunded(_contributionId)
  {
      contributions[_contributionId].refunded = true;
      if (contributions[_contributionId].token == address(0)) {
          contributions[_contributionId].contributor.transfer(contributions[_contributionId].amount);
      } else {
          require(StandardToken(contributions[_contributionId].token).transfer(contributions[_contributionId].contributor, contributions[_contributionId].amount));
      }

  }

  function fulfillBounty(address _fulfiller, string _data)
      public
      validateNotTooManyFulfillments
      notController(_fulfiller)
  {
      fulfillments.push(Fulfillment(_fulfiller, _data, false));

      BountyFulfilled(_fulfiller, (fulfillments.length - 1));
  }

  function updateFulfillment(uint _fulfillmentId, string _data)
      public
      validateFulfillmentArrayIndex(_fulfillmentId)
      onlyFulfiller(_fulfillmentId)
      fulfillmentNotYetAccepted(_fulfillmentId)
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
      onlyController
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
      onlyController
  {
    for (uint256 i = 0; i < _payoutTokens.length; i++) {
      uint toPay;
      if (_payoutTokens[i] == address(0x0)) {
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
          returns (address, string, bool)
      {
          return (fulfillments[_fulfillmentId].fulfiller,
                  fulfillments[_fulfillmentId].data,
                  fulfillments[_fulfillmentId].accepted);
      }
}
