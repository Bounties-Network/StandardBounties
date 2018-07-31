pragma solidity ^0.4.18;
import "./inherited/StandardToken.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment

contract StandardBounty {

  /*
   * Storage
   */

  address public masterCopy;

  address public issuer;

  address public arbiter;

  uint public deadline;

  bool public hasPaidOut;

  Fulfillment[] public fulfillments;

  Contribution[] public contributions;



  /*
   * Events
   */

  event BountyInitialized(address _creator, address _issuer, address _arbiter, string _data, uint _deadline);
  event ReceivedETH(address _sender, uint _value);
  event ContributionAdded(address _contributor, uint _contributionId);
  event ContributionRefunded(uint _contributionId);
  event IntentionSubmitted(address _fulfiller);
  event BountyFulfilled(uint256 _fulfillmentId, address _submitter, string _data);
  event FulfillmentAccepted(uint256 _fulfillmentId, address _issuer, StandardToken[] _payoutTokens, uint[] _tokenAmounts);
  event BountyDrained(address _issuer, StandardToken[] _payoutTokens);
  event BountyChanged(address _oldIssuer, address _newIssuer, address _newArbiter, string _newData, uint _newDeadline);
  event BountyIssuerChanged(address _oldController, address _newController);
  event BountyArbiterChanged(address _issuer, address _arbiter);
  event BountyDataChanged(address _issuer, string _newData);
  event BountyDeadlineChanged(address _issuer, uint _deadline);
  event MasterCopyChanged(address _issuer, address _newMasterCopy);

  /*
   * Structs
   */
  struct Fulfillment {
      address[] fulfillers;
      uint[] numerators;
      uint denomenator;
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

  modifier onlyIssuer() {
      require(msg.sender == issuer);
      _;
  }

  modifier onlyApprover() {
      require(msg.sender == issuer || msg.sender == arbiter);
      _;
  }

  modifier validateContributionArrayIndex(uint _index) {
      require(_index < contributions.length);
      _;
  }

  modifier validateFulfillmentArrayIndex(uint _index) {
      require(_index < fulfillments.length);
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

  modifier sameLength(uint l1, uint l2){
      require(l1 == l2);
      _;
  }

  modifier sumToOneAndNoneZero(uint[] _numerators, uint _denomenator){
    // to determine whether the fractions sum to 1, we will sum the numerators
    // and require that this sum equals the denomenator
      uint sum = 0;
      for (uint i = 0; i < _numerators.length; i++){
        require(_numerators[i] > 0);
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
    // the fallback function is payable, so that people may contribute to a
    // bounty just by sending ETH to the contract address

    ReceivedETH(msg.sender, msg.value);
  }

  /*
    @dev When using the proxy architecture, bounties must be initialized in a
    separate call from the constructor
    @param _issuer the address which has the right to administer the funds in
    the bounty, to either accept submissions or drain the bounty of it's funds
    @param _arbiter the address which only has the rights to accept submissions
    @param _data a string representing an IPFS hash, storing auxiliary data off-chain
    @param _deadline a uint timestamp representing the deadline for receiving new submissions
    */
  function initializeBounty(
      address _issuer,
      address _arbiter,
      string _data,
      uint _deadline)
      public
  {
    require(issuer == address(0));
    require(_issuer != address(0));
    // an issuer of a bounty is only 0x0 when it is uninitialized,
    // so this check prevents initialization from being called multiple times

    issuer = _issuer;
    arbiter = _arbiter;
    deadline = _deadline;

    BountyInitialized(msg.sender, _issuer, _arbiter, _data, _deadline);
  }

  /*
    @dev While non-refundable contributions can be made automatically using either
    the default fallback function (for ETH transfers) or simply sending tokens to
    the bounty address, refundable contributions may also be made to a bounty.
    Refunds are only available to individuals if the bounty has not yet paid out
    to one or more fulfillments.
    @param _amounts an array which contains the units of the tokens which are being
    contributed to the bounty
    @param _tokens an array of token addresses which are being contributed
    NOTE: for ETH contributions, the address should be address(0)
    */
  function refundableContribute(uint[] _amounts, StandardToken[] _tokens)
  public
  payable
  sameLength(_amounts.length, _tokens.length)
  {
    contributions.push(Contribution(msg.sender, _amounts, _tokens, false));
    uint contributionId = contributions.length - 1;
    for (uint i = 0; i < _amounts.length; i++){
      // contributions cannot contain multiple transactions in the same token
      require(!contributions[contributionId].hasContributed[_tokens[i]]);
      require(_amounts[i] > 0);
      if (_tokens[i] == address(0)){
          require(msg.value == _amounts[i]);
      } else {
          require(_tokens[i].transferFrom(msg.sender, this, _amounts[i]));
      }

      // the contribution in that token is only completed once the transfer
      // has been performed
      contributions[contributionId].hasContributed[_tokens[i]] = true;
    }
    ContributionAdded(msg.sender, contributions.length - 1);
  }

  /*
    @dev If a bounty has not accepted any fulfillments yet, refunds may be requested
    by contributors who originally called refundableContribute().
    @param _contributionId the ID of the contribution which is being refunded
    */
  function refundContribution(uint _contributionId)
  public
  hasNotPaid
  validateContributionArrayIndex(_contributionId)
  onlyContributor(_contributionId)
  notYetRefunded(_contributionId)
  {
    require(deadline < now);

    Contribution storage contribution = contributions[_contributionId];
    contribution.refunded = true;

    for (uint i = 0; i < contribution.amounts.length; i++){
      // a contribution may only be refunded if it has finished contributing
      require(contribution.hasContributed[contribution.tokens[i]]);

      if (contribution.tokens[i] == address(0)){
          contribution.contributor.transfer(
            contribution.amounts[i]);
      } else {
          require(contribution.tokens[i].transfer(contribution.contributor,
                                                  contribution.amounts[i]));
      }
    }
    ContributionRefunded(_contributionId);
  }

  function submitIntention()
      public
  {
      IntentionSubmitted(msg.sender);
  }

  /*
    @dev A submission can be made to a bounty, in order to get the funds locked
    up in it.
    @param _fulfillers an array of addresses which contributed to the submission
    (and should be paid)
    @param _numerators an array of numerators for the fractions of the payout which
    should go to each fulfiller
    @param _denominator the denomenator for the fractions of the payout going to
    each fulfiller
    @param _data a string representing an IPFS hash, storing the data associated
    with the submission
    */
  function fulfillBounty(address[] _fulfillers, uint[] _numerators, uint _denomenator, string _data)
      public
      sameLength(_fulfillers.length, _numerators.length)
      sumToOneAndNoneZero(_numerators, _denomenator)
  {
      require(now < deadline);

      fulfillments.push(
        Fulfillment(_fulfillers, _numerators, _denomenator, false));

      BountyFulfilled((fulfillments.length - 1), msg.sender, _data);
  }

  /*
    @dev A pure function to calculate the eventual payout given a fraction (a
    numerator and denomenator), and a balance
    @param _balance the original amount of tokens to be paid
    @param _numerator the numerator of the fraction
    @param _denominator the denomenator of the fraction
    */
  function calculateFraction(uint _balance, uint _numerator, uint _denomenator)
      public
      pure
      returns (uint newBalanceDiv)
  {
    require(_numerator != 0);
    require(_denomenator != 0);

    //first multiplies by the numerator (to minimize possible rounding error)
    uint newBalanceMult = _balance * _numerator;
    require(newBalanceMult / _numerator == _balance);

    //then divides by the denomenator
    newBalanceDiv = newBalanceMult / _denomenator;
  }

  /*
    @dev to pay out a given submission, the issuer of the bounty must call
    acceptFulfillment, releasing a payment to the fulfillers, denoted in the specific
    token amounts for given tokens of their choosing
    @param _fulfillmentId the ID of the fulfillment being accepted
    @param _payoutTokens the array of addresses corresponding to tokens which
    are being paid out to the fulfillers
    NOTE: for ETH payouts, the address should be address(0)
    @param _tokenAmounts the array of the number of units of each _payoutToken
    which are rewarded to the fulfillment in question
    */
  function acceptFulfillment(uint _fulfillmentId, StandardToken[] _payoutTokens, uint[] _tokenAmounts)
      public
      validateFulfillmentArrayIndex(_fulfillmentId)
      sameLength(_payoutTokens.length, _tokenAmounts.length)
      onlyApprover
  {
      // now that the bounty has paid out at least once, refunds are no longer possible
      hasPaidOut = true;
      Fulfillment storage fulfillment = fulfillments[_fulfillmentId];

      for (uint256 i = 0; i < _payoutTokens.length; i++){
        // for each token which the bounty issuer wishes to pay
        if (_payoutTokens[i] == address(0)){
          for (uint256 j = 0; j < fulfillment.fulfillers.length; j++){
            // for each fulfiller associated with the submission

            //checks to make sure there is a sufficient balance in ETH
            require(this.balance >= _tokenAmounts[i]);

            // calculates the payout for the fulfiller based on the total payout
            // in ETH, and the fraction of the reward owed to the fulfiller
            fulfillment.fulfillers[j].transfer(
              calculateFraction(_tokenAmounts[i],
                                fulfillment.numerators[j],
                                fulfillment.denomenator));
          }
        } else {
          for (j = 0; j < fulfillment.fulfillers.length; j++){
            // for each fulfiller associated with the submission
            //checks to make sure there is a sufficient balance in that token
            require(_payoutTokens[i].balanceOf(this) >= _tokenAmounts[i]);
            // calculates the payout for the fulfiller based on the total payout
            // in that token, and the fraction of the reward owed to the fulfiller
            require(_payoutTokens[i].transfer(
              fulfillment.fulfillers[j],
              calculateFraction(_tokenAmounts[i],
                                fulfillment.numerators[j],
                                fulfillment.denomenator)));

          }
        }

      }

      FulfillmentAccepted(_fulfillmentId, msg.sender, _payoutTokens, _tokenAmounts);
  }

  /*
    @dev to circumvent requiring fulfillments to be submitted on-chain, issuers
    of the bounty may call this function to simultaneously submit the fulfillment
    on-chain for later audit, and accept that fulfillment to release payment
    @param _fulfillers an array of addresses which contributed to the submission
    (and should be paid)
    @param _numerators an array of numerators for the fractions of the payout which
    should go to each fulfiller
    @param _denominator the denomenator for the fractions of the payout going to
    each fulfiller
    @param _data a string representing an IPFS hash, storing the data associated
    with the submission
    @param _payoutTokens the array of addresses corresponding to tokens which
    are being paid out to the fulfillers
    NOTE: for ETH payouts, the address should be address(0)
    @param _tokenAmounts the array of the number of units of each _payoutToken
    which are rewarded to the fulfillment in question
    */
  function fulfillAndAccept(address[] _fulfillers, uint[] _numerators, uint _denomenator, string _data, StandardToken[] _payoutTokens, uint[] _tokenAmounts)
      public
      sameLength(_payoutTokens.length, _tokenAmounts.length)
      onlyApprover
  {
      //first fulfills the bounty for the fulfillers
      fulfillBounty(_fulfillers, _numerators, _denomenator, _data);
      acceptFulfillment(fulfillments.length - 1, _payoutTokens, _tokenAmounts);
  }
  /*
    @dev if funds remain in the bounty and the issuer wants to be refunded,
    they may call this function to return the entire balance in the given tokens
    @param _payoutTokens the array of token addresses which are to be returned
    to the issuer
    NOTE: for ETH refunds, the address should be address(0)
    */
  function drainBounty(StandardToken[] _payoutTokens)
      public
      onlyIssuer
  {
    for (uint256 i = 0; i < _payoutTokens.length; i++){
      // for each token that the issuer wishes to receive
      uint toPay;

      if (_payoutTokens[i] == address(0)){
        toPay = this.balance;
        issuer.transfer(toPay);
      } else {
        toPay = _payoutTokens[i].balanceOf(this);
        require(_payoutTokens[i].transfer(issuer, toPay));
      }
    }
      BountyDrained(msg.sender, _payoutTokens);
  }

  /*
    @dev at any point the issuer may call changeBounty, to change either
    the issuer of the bounty, or the data associated with it
    @param _issuer the address of the new issuer
    @param _arbiter the address of the new arbiter
    @param _data the new IPFS hash associated with the updated data
    @param _deadline the new deadline
    */
  function changeBounty(address _issuer, address _arbiter, string _data, uint _deadline)
      public
      onlyIssuer
  {
      issuer = _issuer;
      arbiter = _arbiter;
      deadline = _deadline;

      BountyChanged(msg.sender, _issuer, _arbiter, _data, _deadline);
  }

  /*
    @dev at any point the issuer may change the issuer associated with
    the bounty
    @param _issuer the address of the new issuer
    */
  function changeIssuer(address _issuer)
      public
      onlyIssuer
  {
      issuer = _issuer;
      BountyIssuerChanged(msg.sender, _issuer);
  }

  /*
    @dev at any point the issuer may change the arbiter associated with
    the bounty
    @param _arbiter the address of the new arbiter
    */
  function changeArbiter(address _arbiter)
      public
      onlyIssuer
  {
      arbiter = _arbiter;
      BountyArbiterChanged(msg.sender, _arbiter);
  }


  /*
    @dev at any point the issuer may change the data associated with
    the bounty
    @param _data the new IPFS hash associated with the updated data
    */
  function changeData(string _data)
      public
      onlyIssuer
  {
      BountyDataChanged(msg.sender, _data);
  }

  /*
    @dev at any point the issuer may change the arbiter associated with
    the bounty
    @param _issuer the address of the new issuer
    */
  function changeDeadline(uint _deadline)
      public
      onlyIssuer
  {
      deadline = deadline;
      BountyDeadlineChanged(msg.sender, _deadline);
  }

  /*
    @dev in order for proxy contracts to be able to change the master copy address
    that they rely on, they may call this function to instruct their proxy to now
    point to a new contract
    @param _masterCopy the new address of the master copy contract
    */
  function changeMasterCopy(StandardBounty _masterCopy)
      public
      onlyIssuer
  {
      require(address(_masterCopy) != 0);
      //this would freeze the bounty and make it unusable

      masterCopy = _masterCopy;
      MasterCopyChanged(msg.sender, _masterCopy);
  }

  /*
    @dev a function to return all public data associated with the bounty
    */
  function getBounty()
      public
      constant
      returns (address, bool, uint, address, address, uint)
  {
      return (issuer,
              hasPaidOut,
              fulfillments.length,
              masterCopy,
              arbiter,
              deadline);
  }

  /*
    @dev a function to return all data associated with a particular fulfillment
    @param _fulfillmentId the ID of the fulfillment in question
    */
  function getFulfillment(uint _fulfillmentId)
      public
      constant
      returns (address[], uint[], uint, bool)
  {
      return (fulfillments[_fulfillmentId].fulfillers,
              fulfillments[_fulfillmentId].numerators,
              fulfillments[_fulfillmentId].denomenator,
              fulfillments[_fulfillmentId].accepted);
  }

  /*
    @dev a function to return all data associated with a particular contribution
    @param _contributionId the ID of the fulfillment in question
    */
  function getContribution(uint _contributionId)
      public
      constant
      returns (address, uint[], StandardToken[], bool)
  {
      return (contributions[_contributionId].contributor,
              contributions[_contributionId].amounts,
              contributions[_contributionId].tokens,
              contributions[_contributionId].refunded);
  }
}
