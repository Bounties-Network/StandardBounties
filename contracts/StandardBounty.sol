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

  address public token;

  uint public tokenVersion;

  bool public hasPaidOut;

  Fulfillment[] public fulfillments;

  Contribution[] public contributions;



  /*
   * Events
   */

  event BountyInitialized(address _creator, address _controller, address[] _approvers, string _data, uint _deadline, address _token, uint _tokenVersion);
  event ContributionAdded(address _contributor, uint _contributionId);
  event ContributionRefunded(uint _contributionId);
  event IntentionSubmitted(address _fulfiller);
  event BountyFulfilled(uint256 _fulfillmentId, address _submitter, string _data);
  event FulfillmentAccepted(uint256 _fulfillmentId, address _controller, uint[] _tokenAmounts);
  event BountyDrained(address _controller, uint _tokenAmount);
  event BountyChanged(address _oldController, address _newController, string _newData);
  event BountyControllerChanged(address _oldController, address _newController);
  event BountyApproverChanged(address _controller, uint _approverId, address _approver);
  event BountyDataChanged(address _controller, string _newData);
  event BountyDeadlineChanged(address _controller, uint _deadline);
  event MasterCopyChanged(address _controller, address _newMasterCopy);


  /*
   * Structs
   */
  struct Fulfillment {
      address[] fulfillers;
      bool accepted;
  }

  struct Contribution {
      address contributor;
      uint amount;
      bool refunded;
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
      uint _deadline,
      address _token,
      uint _tokenVersion)
      public
  {
    require(controller == address(0));
    require(_controller != address(0));
    // an controller of a bounty is only 0x0 when it is uninitialized,
    // so this check prevents initialization from being called multiple times

    controller = _controller;
    approvers = _approvers;
    deadline = _deadline;
    token = _token;
    tokenVersion = _tokenVersion;

    BountyInitialized(msg.sender, _controller, _approvers, _data, _deadline, _token, _tokenVersion);
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
  function refundableContribute(uint _amount)
  public
  payable
  {
    contributions.push(Contribution(msg.sender, _amount, false));
    uint contributionId = contributions.length - 1;

    if (tokenVersion == 0){
        require(_amount > 0);
        require(msg.value == _amount);
    } else if (tokenVersion == 20) {
        require(StandardToken(token).transferFrom(msg.sender, this, _amount));
    } else if (tokenVersion == 721) {
        ERC721BasicToken(token).transferFrom(msg.sender, this, _amount);
    } else {
      throw;
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

    if (tokenVersion == 0){
      contribution.contributor.transfer(contribution.amount);
    } else if (tokenVersion == 20) {
      require(StandardToken(token).transfer(contribution.contributor,
                                              contribution.amount));
    } else if (tokenVersion == 721) {
        ERC721BasicToken(token).transferFrom(this, contribution.contributor, contribution.amount);
    } else {
      throw;
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
    @param _tokenAmounts the array of the number of units of each _payoutToken
    which are rewarded to the fulfillment in question
    */
  function acceptFulfillment(uint _approverId, uint _fulfillmentId,  uint[] _tokenAmounts)
      public
      validateFulfillmentArrayIndex(_fulfillmentId)
      validateApproverArrayIndex(_approverId)
      sameLength(_tokenAmounts.length, fulfillments[_fulfillmentId].fulfillers.length)
      canApprove(_approverId)
  {

      // now that the bounty has paid out at least once, refunds are no longer possible
      hasPaidOut = true;

      Fulfillment storage fulfillment = fulfillments[_fulfillmentId];
      require(_tokenAmounts.length == fulfillment.fulfillers.length);

      for (uint256 i = 0; i < fulfillment.fulfillers.length; i++){
        // for each fulfiller associated with the submission

        if (_tokenAmounts[i] != 0){
          if (tokenVersion == 0){
              require(this.balance >= _tokenAmounts[i]);
              fulfillment.fulfillers[i].transfer(_tokenAmounts[i]);
          } else if (tokenVersion == 20) {
            require(StandardToken(token).transfer(
              fulfillment.fulfillers[i], _tokenAmounts[i]));
          } else if (tokenVersion == 721) {
              ERC721BasicToken(token).safeTransferFrom(this, fulfillment.fulfillers[i], _tokenAmounts[i]);
          } else {
            throw;
          }
        }

      }

       FulfillmentAccepted(_fulfillmentId, msg.sender, _tokenAmounts);

  }

  /*
    @dev to circumvent requiring fulfillments to be submitted on-chain, controllers
    of the bounty may call this function to simultaneously submit the fulfillment
    on-chain for later audit, and accept that fulfillment to release payment
    @param _fulfillers an array of addresses which contributed to the submission
    (and should be paid)
    @param _payoutTokens the array of addresses corresponding to tokens which
    are being paid out to the fulfillers
    @param _tokenVersions an array of integegers representing the version of the token
    contract (ie 0 for ETH, 20 for ERC20, 721 for ERC721)
    @param _tokenAmounts the array of the number of units of each _payoutToken
    which are rewarded to the fulfillment in question
    */
  function fulfillAndAccept(uint _approverId, address[] _fulfillers, string _data, uint[] _tokenAmounts)
      public
  {
      // first fulfills the bounty for the fulfillers
      fulfillBounty(_fulfillers, _data);

      // then accepts the fulfillment
      acceptFulfillment(_approverId, fulfillments.length - 1, _tokenAmounts);
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
  function drainBounty(uint _tokenAmount)
      public
      onlyController
  {
      // for each token that the controller wishes to receive
      if (tokenVersion == 0){
          controller.transfer(_tokenAmount);
      } else if (tokenVersion == 20) {
        require(StandardToken(token).transfer(
          controller, _tokenAmount));
      } else if (tokenVersion == 721) {
        ERC721BasicToken(token).transferFrom(
          this, controller, _tokenAmount);
      }

      BountyDrained(msg.sender, _tokenAmount);
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
      returns (address, uint, bool)
  {
      return (contributions[_contributionId].contributor,
              contributions[_contributionId].amount,
              contributions[_contributionId].refunded);
  }
}
