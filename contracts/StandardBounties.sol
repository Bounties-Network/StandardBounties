pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;
import "./inherited/StandardToken.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment through
/// stepwise work submission, acceptance, and payment
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>

library StandardBountyLibrary {

  /*
   * Events
   */
  event FulfillmentUpdated(uint _fulfillmentId);
  event FulfillmentAccepted(address fulfiller, uint256 _fulfillmentId);
  event BountyDrained(address issuer);
  event BountyChanged();


    /*
     * Structs
     */

    struct Bounty {
      address issuer;
      string data;
      address arbiter;

      Fulfillment[] fulfillments;
    }

    struct Fulfillment {
        address fulfiller;
        string data;
    }

    /*
     * Modifiers
     */



    modifier onlyIssuer(Bounty _bounty) {
        require(msg.sender == _bounty.issuer);
        _;
    }

    modifier onlyIssuerOrArbiter(Bounty _bounty) {
        require(msg.sender == _bounty.issuer || msg.sender == _bounty.arbiter);
        _;
    }

    modifier onlyFulfiller(Bounty _bounty, uint _fulfillmentId) {
        require(msg.sender == _bounty.fulfillments[_fulfillmentId].fulfiller);
        _;
    }

    modifier validateFulfillmentArrayIndex(Bounty _bounty, uint _index) {
        require(_index < _bounty.fulfillments.length);
        _;
    }



  /// @dev updateFulfillment(): Submit updated data for a given fulfillment
  /// @param _fulfillmentId the index of the fulfillment
  /// @param _data the new data being submitted
  function updateFulfillment(Bounty _bounty, uint _fulfillmentId, string _data)
      public
      validateFulfillmentArrayIndex(_bounty, _fulfillmentId)
      onlyFulfiller(_bounty, _fulfillmentId)
  {
      _bounty.fulfillments[_fulfillmentId].data = _data;
      FulfillmentUpdated(_fulfillmentId);
  }

  function getFraction(uint _balance, uint _numerator, uint _denomenator)
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

  /// @dev acceptFulfillment(): accept a given fulfillment
  /// @param _fulfillmentId the index of the fulfillment being accepted
  function acceptFulfillment(Bounty _bounty, uint _fulfillmentId, uint _numerator, uint _denomenator, StandardToken[] _payoutTokens)
      public
      validateFulfillmentArrayIndex(_bounty, _fulfillmentId)
      onlyIssuerOrArbiter(_bounty)
  {
      for (uint256 i = 0; i < _payoutTokens.length; i++){
        uint toPay;
        if (_payoutTokens[i] == address(0x0)){
          toPay = this.balance;
          toPay = getFraction(toPay, _numerator, _denomenator);

          _bounty.fulfillments[_fulfillmentId].fulfiller.transfer(toPay);

        } else {
          toPay = _payoutTokens[i].balanceOf(this);
          toPay = getFraction(toPay, _numerator, _denomenator);
          require(_payoutTokens[i].transfer(_bounty.fulfillments[_fulfillmentId].fulfiller, toPay));
        }
      }
      FulfillmentAccepted(msg.sender, _fulfillmentId);
  }

  /// @dev killBounty(): drains the contract of it's remaining
  /// funds, and moves the bounty into stage 3 (dead) since it was
  /// either killed in draft stage, or never accepted any fulfillments
  function drainBounty(Bounty _bounty, StandardToken[] _payoutTokens)
      public
      onlyIssuer(_bounty)
  {
    for (uint256 i = 0; i < _payoutTokens.length; i++){
      uint toPay;
      if (_payoutTokens[i] == address(0x0)){
        toPay = this.balance;
        _bounty.issuer.transfer(toPay);

      } else {
        toPay = _payoutTokens[i].balanceOf(this);
        require(_payoutTokens[i].transfer(_bounty.issuer, toPay));
      }
    }
      BountyDrained(msg.sender);
  }

    /// @dev changeData(): allows the issuer to change a bounty's data
    function changeBounty(Bounty _bounty, address _issuer, address _arbiter, string _data)
        public
        onlyIssuer(_bounty)
    {
        _bounty.issuer = _issuer;
        _bounty.data = _data;
        BountyChanged();
    }

    /// @dev getBounty(): Returns the details of the bounty
    /// @return Returns a tuple for the bounty


}

contract StandardBounty {

 event BountyFulfilled(address fulfiller, uint256 _fulfillmentId);


  using StandardBountyLibrary for StandardBountyLibrary.Bounty;

  StandardBountyLibrary.Bounty bounty;


    modifier validateNotTooManyFulfillments(){
      require((bounty.fulfillments.length + 1) > bounty.fulfillments.length);
      _;
    }
    modifier notIssuerOrArbiter() {
        require(msg.sender != bounty.issuer);
        _;
    }

  /*
   * Public functions
   */

  /// @dev issueAndActivateBounty(): instantiates a new draft bounty
  /// @param _issuer the address of the intended issuer of the bounty
  /// @param _data the requirements of the bounty
  function StandardBounty(
      address _issuer,
      string _data,
      address _arbiter
      )
      public
  {
    bounty.issuer = _issuer;
    bounty.data = _data;
    bounty.arbiter = _arbiter;
  }

  /// @dev fulfillBounty(): submit a fulfillment for the given bounty
  /// @param _data the data artifacts representing the fulfillment of the bounty
  function fulfillBounty(address _fulfiller, string _data)
      public
      validateNotTooManyFulfillments()
      notIssuerOrArbiter()
  {
      bounty.fulfillments.push(StandardBountyLibrary.Fulfillment(_fulfiller, _data));

      BountyFulfilled(_fulfiller, (bounty.fulfillments.length - 1));
  }

  function getBounty()
        public
        constant
        returns (address, address, string, StandardBountyLibrary.Fulfillment[])
    {
        return (bounty.issuer,
                bounty.arbiter,
                bounty.data,
                bounty.fulfillments);
    }


}
