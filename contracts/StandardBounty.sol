pragma solidity ^0.4.18;
pragma experimental ABIEncoderV2;

import "./inherited/StandardToken.sol";
import "./inherited/ERC721Basic.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment

contract StandardBounty {

  /*
   * Storage
   */

  address public masterCopy;

  address public controller;

  address[] public approvers;

  uint public deadline;

  bool public hasPaidOut;

  Fulfillment[] public fulfillments;

  Contribution[] public contributions;



  /*
   * Events
   */

  event BountyInitialized(address _creator, address _controller, address[] _approvers, string _data, uint _deadline);
  event ContributionAdded(address _contributor, uint _contributionId);
  event ContributionRefunded(uint _contributionId);
  event IntentionSubmitted(address _fulfiller);
  event BountyFulfilled(uint256 _fulfillmentId, address _submitter, string _data);
  event FulfillmentAccepted(uint256 _fulfillmentId, address _controller, address[] _payoutTokens, uint[][] _tokenAmounts);
  event BountyDrained(address _controller, address[] _payoutTokens, uint[] _tokenAmounts);
  event BountyChanged(address _oldController, address _newController, string _newData);
  event BountyControllerChanged(address _oldController, address _newController);
  event BountyApproverChanged(address _controller, uint _approverId, address _approver);
  event BountyDataChanged(address _controller, string _newData);
  event BountyDeadlineChanged(address _controller, uint _deadline);
  event MasterCopyChanged(address _controller, address _newMasterCopy);

  event LogEvent(uint u1, uint u2, uint u3);

  /*
   * Structs
   */
  struct Fulfillment {
      address[] fulfillers;
      bool accepted;
  }

  struct Contribution {
      address contributor;
      uint[] amounts;
      address[] tokens;
      uint[] tokenVersions;
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

  modifier canApprove(uint _approverId) {
      require(msg.sender == controller || msg.sender == approvers[_approverId]);
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

  modifier validateApproverArrayIndex(uint _index) {
      require(_index < approvers.length);
      _;
  }

  modifier validateNotTooManyFulfillments(){
    require((fulfillments.length + 1) > fulfillments.length);
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
  }

  /*
    @dev When using the proxy architecture, bounties must be initialized in a
    separate call from the constructor
    @param _controller the address which has the right to administer the funds in
    the bounty, to either accept submissions or drain the bounty of it's funds
    @param _arbiter the address which only has the rights to accept submissions
    @param _data a string representing an IPFS hash, storing auxiliary data off-chain
    @param _deadline a uint timestamp representing the deadline for receiving new submissions
    */
  function initializeBounty(
      address _controller,
      address[] _approvers,
      string _data,
      uint _deadline)
      public
  {
    require(controller == address(0));
    require(_controller != address(0));
    // an controller of a bounty is only 0x0 when it is uninitialized,
    // so this check prevents initialization from being called multiple times

    controller = _controller;
    approvers = _approvers;
    deadline = _deadline;

    BountyInitialized(msg.sender, _controller, _approvers, _data, _deadline);
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
    @param _tokenVersions an array of integegers representing the version of the token
    contract (ie 0 for ETH, 20 for ERC20, 721 for ERC721)
    */
  function refundableContribute(uint[] _amounts, address[] _tokens, uint[] _tokenVersions)
  public
  payable
  sameLength(_amounts.length, _tokens.length)
  sameLength(_amounts.length, _tokenVersions.length)
  {
    contributions.push(Contribution(msg.sender, _amounts, _tokens, _tokenVersions, false));
    uint contributionId = contributions.length - 1;
    for (uint i = 0; i < _amounts.length; i++){
      // contributions cannot contain multiple transactions in the same token

      //require(!contributions[contributionId].hasContributed[_tokens[i]]);
      if (_tokenVersions[i] == 0){
          require(_amounts[i] > 0);
          require(msg.value == _amounts[i]);
      } else if (_tokenVersions[i] == 20) {
          require(StandardToken(_tokens[i]).transferFrom(msg.sender, this, _amounts[i]));
      } else if (_tokenVersions[i] == 721) {
          ERC721BasicToken(_tokens[i]).transferFrom(msg.sender, this, _amounts[i]);
      } else {
        throw;
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

    Contribution contribution = contributions[_contributionId];
    contribution.refunded = true;


    for (uint i = 0; i < contribution.amounts.length; i++){
      // a contribution may only be refunded if it has finished contributing
      require(contribution.hasContributed[contribution.tokens[i]]);


      if (contribution.tokenVersions[i] == 0){
        contribution.contributor.transfer(contribution.amounts[i]);
      } else if (contribution.tokenVersions[i] == 20) {
        require(StandardToken(contribution.tokens[i]).transfer(contribution.contributor,
                                                contribution.amounts[i]));
      } else if (contribution.tokenVersions[i] == 721) {
          ERC721BasicToken(contribution.tokens[i]).transferFrom(this, contribution.contributor, contribution.amounts[i]);
      } else {
        throw;
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
  function fulfillBounty(address[] _fulfillers, string _data)
      public
      validateNotTooManyFulfillments
  {
      require(now < deadline);

      fulfillments.push(Fulfillment(_fulfillers, false));

      BountyFulfilled((fulfillments.length - 1), msg.sender, _data);
  }

  /*
    @dev to pay out a given submission, the controller of the bounty must call
    acceptFulfillment, releasing a payment to the fulfillers, denoted in the specific
    token amounts for given tokens of their choosing
    @param _fulfillmentId the ID of the fulfillment being accepted
    @param _payoutTokens the array of addresses corresponding to tokens which
    are being paid out to the fulfillers
    @param _tokenVersions an array of integegers representing the version of the token
    contract (ie 0 for ETH, 20 for ERC20, 721 for ERC721)
    @param _tokenAmounts the array of the number of units of each _payoutToken
    which are rewarded to the fulfillment in question
    */
  function acceptFulfillment(uint _approverId, uint _fulfillmentId, address[] _payoutTokens, uint[] _tokenVersions, uint[][] _tokenAmounts)
      public
      validateFulfillmentArrayIndex(_fulfillmentId)
      validateApproverArrayIndex(_approverId)
      sameLength(_payoutTokens.length, _tokenVersions.length)
      canApprove(_approverId)
  {

      // now that the bounty has paid out at least once, refunds are no longer possible
      hasPaidOut = true;

      Fulfillment storage fulfillment = fulfillments[_fulfillmentId];
      require(_tokenAmounts.length == fulfillment.fulfillers.length);

      for (uint256 i = 0; i < fulfillment.fulfillers.length; i++){
        // for each fulfiller associated with the submission
        require(_tokenAmounts[i].length == _payoutTokens.length);

        for (uint256 j = 0; j < _payoutTokens.length; j++){
          // for each token which the bounty issuer wishes to pay
          if (_tokenAmounts[i][j] != 0){
            if (_tokenVersions[j] == 0){
                require(this.balance >= _tokenAmounts[i][j]);
                fulfillment.fulfillers[i].transfer(_tokenAmounts[i][j]);
            } else if (_tokenVersions[j] == 20) {
              require(StandardToken(_payoutTokens[j]).transfer(
                fulfillment.fulfillers[i], _tokenAmounts[i][j]));
            } else if (_tokenVersions[j] == 721) {
                ERC721BasicToken(_payoutTokens[j]).safeTransferFrom(this, fulfillment.fulfillers[i], _tokenAmounts[i][j]);
            } else {
              throw;
            }
          }

        }
      }

       FulfillmentAccepted(_fulfillmentId, msg.sender, _payoutTokens, _tokenAmounts);

  }

  /*
    @dev to circumvent requiring fulfillments to be submitted on-chain, controllers
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
    @param _tokenVersions an array of integegers representing the version of the token
    contract (ie 0 for ETH, 20 for ERC20, 721 for ERC721)
    @param _tokenAmounts the array of the number of units of each _payoutToken
    which are rewarded to the fulfillment in question
    */
  function fulfillAndAccept(uint _approverId, address[] _fulfillers, string _data, address[] _payoutTokens, uint[] _tokenVersions, uint[][] _tokenAmounts)
      public
  {
      // first fulfills the bounty for the fulfillers
      fulfillBounty(_fulfillers, _data);

      // then accepts the fulfillment
      acceptFulfillment(_approverId, fulfillments.length - 1, _payoutTokens, _tokenVersions, _tokenAmounts);
  }
  /*
    @dev if funds remain in the bounty and the controller wants to be refunded,
    they may call this function to return the entire balance in the given tokens
    @param _payoutTokens the array of token addresses which are to be returned
    to the controller
    @param _tokenVersions an array of integegers representing the version of the token
    contract (ie 0 for ETH, 20 for ERC20, 721 for ERC721)
    @param _tokenAmounts the values of the tokens which are being drained
    */
  function drainBounty(address[] _payoutTokens, uint[] _tokenVersions, uint[] _tokenAmounts)
      public
      onlyController
      sameLength(_payoutTokens.length, _tokenVersions.length)
      sameLength(_payoutTokens.length, _tokenAmounts.length)
  {
    for (uint256 i = 0; i < _payoutTokens.length; i++){
      // for each token that the controller wishes to receive
      if (_tokenVersions[i] == 0){
          controller.transfer(_tokenAmounts[i]);
      } else if (_tokenVersions[i] == 20) {
        require(StandardToken(_payoutTokens[i]).transfer(
          controller, _tokenAmounts[i]));
      } else if (_tokenVersions[i] == 721) {
        ERC721BasicToken(_payoutTokens[i]).transferFrom(
          this, controller, _tokenAmounts[i]);
      }
    }
      BountyDrained(msg.sender, _payoutTokens, _tokenAmounts);
  }

  /*
    @dev at any point the controller may call changeBounty, to change either
    the controller of the bounty, or the data associated with it
    @param _controller the address of the new controller
    @param _arbiter the address of the new arbiter
    @param _data the new IPFS hash associated with the updated data
    @param _deadline the new deadline
    */
  function changeBounty(address _controller, address[] _approvers, string _data, uint _deadline)
      public
      onlyController
  {
      controller = _controller;
      approvers = _approvers;
      deadline = _deadline;
      BountyChanged(msg.sender, _controller, _data);
  }

  /*
    @dev at any point the controller may change the controller associated with
    the bounty
    @param _controller the address of the new controller
    */
  function changeController(address _controller)
      public
      onlyController
  {
      controller = _controller;
      BountyControllerChanged(msg.sender, _controller);
  }

  /*
    @dev at any point the controller may change the arbiter associated with
    the bounty
    @param _controller the address of the new controller
    */
  function changeApprover(uint _approverId, address _approver)
      public
      onlyController
      validateApproverArrayIndex(_approverId)
  {
      approvers[_approverId] = _approver;
      BountyApproverChanged(msg.sender, _approverId, _approver);
  }


  /*
    @dev at any point the controller may change the data associated with
    the bounty
    @param _data the new IPFS hash associated with the updated data
    */
  function changeData(string _data)
      public
      onlyController
  {
      BountyDataChanged(msg.sender, _data);
  }

  /*
    @dev at any point the controller may change the arbiter associated with
    the bounty
    @param _controller the address of the new controller
    */
  function changeDeadline(uint _deadline)
      public
      onlyController
  {
      deadline = deadline;
      BountyDeadlineChanged(msg.sender, _deadline);
  }

  function addApprover(address[] _approvers)
      public
      onlyController
  {
      for (uint i = 0; i < _approvers.length; i++){
        approvers.push(_approvers[i]);
      }
  }

  /*
    @dev a function to return all public data associated with the bounty
    */
  function getBounty()
      public
      constant
      returns (address, bool, uint, address, address[], uint)
  {
      return (controller,
              hasPaidOut,
              fulfillments.length,
              masterCopy,
              approvers,
              deadline);
  }

  /*
    @dev a function to return all data associated with a particular fulfillment
    @param _fulfillmentId the ID of the fulfillment in question
    */
  function getFulfillment(uint _fulfillmentId)
      public
      constant
      returns (address[], bool)
  {
      return (fulfillments[_fulfillmentId].fulfillers,
              fulfillments[_fulfillmentId].accepted);
  }

  /*
    @dev a function to return all data associated with a particular contribution
    @param _contributionId the ID of the fulfillment in question
    */
  function getContribution(uint _contributionId)
      public
      constant
      returns (address, uint[], address[], uint[], bool)
  {
      return (contributions[_contributionId].contributor,
              contributions[_contributionId].amounts,
              contributions[_contributionId].tokens,
              contributions[_contributionId].tokenVersions,
              contributions[_contributionId].refunded);
  }
}
