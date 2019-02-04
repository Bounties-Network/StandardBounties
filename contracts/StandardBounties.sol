pragma solidity ^0.4.18;
pragma experimental ABIEncoderV2;

import "./inherited/StandardToken.sol";
import "./inherited/ERC721Basic.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment through
/// stepwise work submission, acceptance, and payment
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounties {

  /*
   * Events
   */
  event BountyIssued(uint _bountyId, address _creator, address _issuer, address[] _approvers, string _data, uint _deadline, address _token, uint _tokenVersion);
  event ContributionAdded(uint _bountyId, uint _contributionId, address _contributor, uint _amount);
  event ContributionRefunded(uint _bountyId, uint _contributionId);
  event IntentionSubmitted(uint _bountyId, address _fulfiller);
  event BountyFulfilled(uint _bountyId, uint _fulfillmentId, address[] _fulfillers, string _data, address _submitter);
  event FulfillmentUpdated(uint _bountyId, uint _fulfillmentId, address[] _fulfillers, string _data, address _submitter);
  event FulfillmentAccepted(uint _bountyId, uint  _fulfillmentId, address _approver, uint[] _tokenAmounts);
  event BountyDrained(uint _bountyId, address _issuer, uint _tokenAmount);
  event BountyChanged(uint _bountyId, address _oldIssuer, address _newIssuer, address[] _approvers, string _data, uint _deadline);
  event BountyControllerChanged(uint _bountyId, address _oldIssuer, address _newIssuer);
  event BountyApproverChanged(uint _bountyId, address _issuer, uint _approverId, address _approver);
  event BountyApproversAdded(uint _bountyId, address _issuer, address[] _approvers);
  event BountyDataChanged(uint _bountyId, address _issuer, string _data);
  event BountyDeadlineChanged(uint _bountyId, address _issuer, uint _deadline);

  /*
   * Structs
   */

  struct Bounty {
      address issuer;
      address[] approvers;
      uint deadline;
      address token;
      uint tokenVersion;
      uint balance;
      bool hasPaidOut;
      Fulfillment[] fulfillments;
      Contribution[] contributions;
  }

  struct Fulfillment {
      address[] fulfillers;
      address submitter;
  }

  struct Contribution {
      address contributor;
      uint amount;
      bool refunded;
  }

  /*
   * Storage
   */

  Bounty[] public bounties;

  /*
   * Enums
   */


  /*
   * Modifiers
   */

   modifier validateBountyArrayIndex(uint _index){
     require(_index < bounties.length);
     _;
   }

   modifier validateContributionArrayIndex(uint _bountyId, uint _index) {
       require(_index < bounties[_bountyId].contributions.length);
       _;
   }

   modifier validateFulfillmentArrayIndex(uint _bountyId, uint _index) {
       require(_index < bounties[_bountyId].fulfillments.length);
       _;
   }

   modifier validateApproverArrayIndex(uint _bountyId, uint _index) {
       require(_index < bounties[_bountyId].approvers.length || _index == 0);
       _;
   }

   modifier onlyIssuer(uint _bountyId) {
       require(msg.sender == bounties[_bountyId].issuer);
       _;
   }

   modifier onlySubmitter(uint _bountyId, uint _fulfillmentId) {
       require(msg.sender == bounties[_bountyId].fulfillments[_fulfillmentId].submitter);
       _;
   }

   modifier onlyContributor(uint _bountyId, uint _contributionId) {
       require(msg.sender == bounties[_bountyId].contributions[_contributionId].contributor);
       _;
   }

   modifier canApprove(uint _bountyId, uint _approverId) {
       require(msg.sender == bounties[_bountyId].issuer || msg.sender == bounties[_bountyId].approvers[_approverId]);
       _;
   }

   modifier hasNotPaid(uint _bountyId){
       require(!bounties[_bountyId].hasPaidOut);
       _;
   }

   modifier notYetRefunded(uint _bountyId, uint _contributionId){
       require(!bounties[_bountyId].contributions[_contributionId].refunded);
       _;
   }

   modifier amountIsNotZero(uint _amount) {
       require(_amount != 0);
       _;
   }

   /*
    * Public functions
    */

   /// @dev issueBounty(): instantiates a new draft bounty
   /// @param _issuer the address of the intended issuer of the bounty
   /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
   /// @param _data the requirements of the bounty
   /// @param _token the address of the contract if _paysTokens is true
   function issueBounty(
       address _issuer,
       address[] _approvers,
       string _data,
       uint _deadline,
       address _token,
       uint _tokenVersion,
       uint _depositAmount)
       public
       returns (uint)
   {
       require(_issuer != address(0));

       Bounty newBounty;
       newBounty.issuer = _issuer;
       newBounty.approvers = _approvers;
       newBounty.deadline = _deadline;
       newBounty.token = _token;
       newBounty.tokenVersion = _tokenVersion;

       bounties.push(newBounty);

       uint bountyId = bounties.length - 1;
       emit BountyIssued(bounties.length - 1, msg.sender, _issuer, _approvers, _data, _deadline, _token, _tokenVersion);

       if (_depositAmount > 0){
         contribute(bountyId, _depositAmount);
       }
       return (bountyId);
   }


   /// @dev contribute(): a function allowing anyone to contribute tokens to a
   /// bounty, as long as it is still before its deadline. Shouldn't keep
   /// them by accident (hence 'value').
   /// @param _bountyId the index of the bounty
   /// @param _amount the amount being contributed in ether to prevent accidental deposits
   /// @notice Please note you funds will be at the mercy of the issuer
   ///  and can be drained at any moment. Be careful!
   function contribute (uint _bountyId, uint _amount)
       payable
       public
       validateBountyArrayIndex(_bountyId)
   {
       bounties[_bountyId].contributions.push(Contribution(msg.sender, _amount, false));
       bounties[_bountyId].balance += _amount;

       if (bounties[_bountyId].tokenVersion == 0){
           require(_amount > 0);
           require(msg.value == _amount);
       } else if (bounties[_bountyId].tokenVersion == 20) {
           require(StandardToken(bounties[_bountyId].token).transferFrom(msg.sender, this, _amount));
       } else if (bounties[_bountyId].tokenVersion == 721) {
           ERC721BasicToken(bounties[_bountyId].token).transferFrom(msg.sender, this, _amount);
       } else {
         throw;
       }

       emit ContributionAdded(_bountyId, bounties[_bountyId].contributions.length - 1, msg.sender, _amount);
   }

   /*
     @dev If a bounty has not accepted any fulfillments yet, refunds may be requested
     by contributors who originally called refundableContribute().
     @param _contributionId the ID of the contribution which is being refunded
     */
   function refundContribution(uint _bountyId, uint _contributionId)
   public
   hasNotPaid(_bountyId)
   validateBountyArrayIndex(_bountyId)
   validateContributionArrayIndex(_bountyId, _contributionId)
   onlyContributor(_bountyId, _contributionId)
   notYetRefunded(_bountyId, _contributionId)
   {
     require(bounties[_bountyId].deadline < now);

     Contribution contribution = bounties[_bountyId].contributions[_contributionId];
     contribution.refunded = true;
     bounties[_bountyId].balance -= contribution.amount;

     if (bounties[_bountyId].tokenVersion == 0){
       contribution.contributor.transfer(contribution.amount);
     } else if (bounties[_bountyId].tokenVersion == 20) {
       require(StandardToken(bounties[_bountyId].token).transfer(contribution.contributor,
                                               contribution.amount));
     } else if (bounties[_bountyId].tokenVersion == 721) {
         ERC721BasicToken(bounties[_bountyId].token).transferFrom(this, contribution.contributor, contribution.amount);
     } else {
       throw;
     }

     emit ContributionRefunded(_bountyId, _contributionId);
   }

   function submitIntention(uint _bountyId)
       public
       validateBountyArrayIndex(_bountyId)
   {
       emit IntentionSubmitted(_bountyId, msg.sender);
   }


   /// @dev fulfillBounty(): submit a fulfillment for the given bounty
   /// @param _bountyId the index of the bounty
   /// @param _data the data artifacts representing the fulfillment of the bounty
   function fulfillBounty(uint _bountyId, address[] _fulfillers, string _data)
       public
       validateBountyArrayIndex(_bountyId)
   {
       require(now < bounties[_bountyId].deadline);

       bounties[_bountyId].fulfillments.push(Fulfillment(_fulfillers, msg.sender));

       emit BountyFulfilled(_bountyId, (bounties[_bountyId].fulfillments.length - 1), _fulfillers, _data, msg.sender);
   }

   /// @dev updateFulfillment(): Submit updated data for a given fulfillment
   /// @param _bountyId the index of the bounty
   /// @param _fulfillmentId the index of the fulfillment
   /// @param _data the new data being submitted
   function updateFulfillment(uint _bountyId, uint _fulfillmentId, address[] _fulfillers, string _data)
       public
       validateBountyArrayIndex(_bountyId)
       validateFulfillmentArrayIndex(_bountyId, _fulfillmentId)
       onlySubmitter(_bountyId, _fulfillmentId)
   {
       bounties[_bountyId].fulfillments[_bountyId].fulfillers = _fulfillers;
       emit FulfillmentUpdated(_bountyId, _fulfillmentId, _fulfillers, _data, msg.sender);
   }

   /// @dev acceptFulfillment(): accept a given fulfillment
   /// @param _bountyId the index of the bounty
   /// @param _fulfillmentId the index of the fulfillment being accepted
   function acceptFulfillment(uint _bountyId, uint _fulfillmentId, uint _approverId, uint[] _tokenAmounts)
       public
       validateBountyArrayIndex(_bountyId)
       validateFulfillmentArrayIndex(_bountyId, _fulfillmentId)
       canApprove(_bountyId, _approverId)
   {
       // now that the bounty has paid out at least once, refunds are no longer possible
       bounties[_bountyId].hasPaidOut = true;

       Fulfillment storage fulfillment = bounties[_bountyId].fulfillments[_fulfillmentId];
       require(_tokenAmounts.length == fulfillment.fulfillers.length);

       for (uint256 i = 0; i < fulfillment.fulfillers.length; i++){
         // for each fulfiller associated with the submission
         require(bounties[_bountyId].balance >= _tokenAmounts[i]);
         bounties[_bountyId].balance -= _tokenAmounts[i];

         if (_tokenAmounts[i] != 0){
           if (bounties[_bountyId].tokenVersion == 0){
               fulfillment.fulfillers[i].transfer(_tokenAmounts[i]);
           } else if (bounties[_bountyId].tokenVersion == 20) {
             require(StandardToken(bounties[_bountyId].token).transfer(
               fulfillment.fulfillers[i], _tokenAmounts[i]));
           } else if (bounties[_bountyId].tokenVersion == 721) {
               ERC721BasicToken(bounties[_bountyId].token).safeTransferFrom(this, fulfillment.fulfillers[i], _tokenAmounts[i]);
           } else {
             throw;
           }
         }

       }
       emit FulfillmentAccepted(_bountyId, _fulfillmentId, msg.sender, _tokenAmounts);
   }

   function fulfillAndAccept(uint _bountyId, uint _approverId, address[] _fulfillers, string _data, uint[] _tokenAmounts)
       public
   {
       // first fulfills the bounty for the fulfillers
       fulfillBounty(_bountyId, _fulfillers, _data);

       // then accepts the fulfillment
       acceptFulfillment(_bountyId, bounties[_bountyId].fulfillments.length - 1, _approverId,  _tokenAmounts);
   }

   /// @dev drainBounty(): drains the contract of it's remaining
   /// funds, and moves the bounty into stage 3 (dead) since it was
   /// either killed in draft stage, or never accepted any fulfillments
   /// @param _bountyId the index of the bounty
   function drainBounty(uint _bountyId, uint _tokenAmount)
       public
       validateBountyArrayIndex(_bountyId)
       onlyIssuer(_bountyId)
   {
       require(bounties[_bountyId].balance >= _tokenAmount);
       bounties[_bountyId].balance -= _tokenAmount;

       if (bounties[_bountyId].tokenVersion == 0){
           bounties[_bountyId].issuer.transfer(_tokenAmount);
       } else if (bounties[_bountyId].tokenVersion == 20) {
         require(StandardToken(bounties[_bountyId].token).transfer(
           bounties[_bountyId].issuer, _tokenAmount));
       } else if (bounties[_bountyId].tokenVersion == 721) {
         ERC721BasicToken(bounties[_bountyId].token).transferFrom(
           this, bounties[_bountyId].issuer, _tokenAmount);
       }

       emit BountyDrained(_bountyId, msg.sender, _tokenAmount);
   }

   /*
     @dev at any point the controller may call changeBounty, to change either
     the controller of the bounty, or the data associated with it
     @param _controller the address of the new controller
     @param _arbiter the address of the new arbiter
     @param _data the new IPFS hash associated with the updated data
     @param _deadline the new deadline
     */
   function changeBounty(uint _bountyId, address _issuer, address[] _approvers, string _data, uint _deadline)
       public
       validateBountyArrayIndex(_bountyId)
       onlyIssuer(_bountyId)
   {
       bounties[_bountyId].issuer = _issuer;
       bounties[_bountyId].approvers = _approvers;
       bounties[_bountyId].deadline = _deadline;
       emit BountyChanged(_bountyId, msg.sender, _issuer, _approvers, _data, _deadline);
   }

   /*
     @dev at any point the controller may change the controller associated with
     the bounty
     @param _controller the address of the new controller
     */
   function changeController(uint _bountyId, address _issuer)
       public
       validateBountyArrayIndex(_bountyId)
       onlyIssuer(_bountyId)
   {
       bounties[_bountyId].issuer = _issuer;
       emit BountyControllerChanged(_bountyId, msg.sender, _issuer);
   }

   /*
     @dev at any point the controller may change the arbiter associated with
     the bounty
     @param _controller the address of the new controller
     */
   function changeApprover(uint _bountyId, uint _approverId, address _approver)
       public
       validateBountyArrayIndex(_bountyId)
       onlyIssuer(_bountyId)
       validateApproverArrayIndex(_bountyId, _approverId)
   {
       bounties[_bountyId].approvers[_approverId] = _approver;
       emit BountyApproverChanged(_bountyId, msg.sender, _approverId, _approver);
   }


   /*
     @dev at any point the controller may change the data associated with
     the bounty
     @param _data the new IPFS hash associated with the updated data
     */
   function changeData(uint _bountyId, string _data)
       public
       validateBountyArrayIndex(_bountyId)
       onlyIssuer(_bountyId)
   {
       emit BountyDataChanged(_bountyId, msg.sender, _data);
   }

   /*
     @dev at any point the controller may change the arbiter associated with
     the bounty
     @param _controller the address of the new controller
     */
   function changeDeadline(uint _bountyId, uint _deadline)
       public
       validateBountyArrayIndex(_bountyId)
       onlyIssuer(_bountyId)
   {
       bounties[_bountyId].deadline = _deadline;
       emit BountyDeadlineChanged(_bountyId, msg.sender, _deadline);
   }

   function addApprovers(uint _bountyId, address[] _approvers)
       public
       validateBountyArrayIndex(_bountyId)
       onlyIssuer(_bountyId)
   {
       for (uint i = 0; i < _approvers.length; i++){
         bounties[_bountyId].approvers.push(_approvers[i]);
       }
       emit BountyApproversAdded(_bountyId, msg.sender, _approvers);
   }


   /// @dev getBounty(): Returns the details of the bounty
   /// @param _bountyId the index of the bounty
   /// @return Returns a tuple for the bounty
   function getBounty(uint _bountyId)
       public
       constant
       validateBountyArrayIndex(_bountyId)
       returns (address, uint, address, uint, uint, bool)
   {
       return (bounties[_bountyId].issuer,
               bounties[_bountyId].deadline,
               bounties[_bountyId].token,
               bounties[_bountyId].tokenVersion,
               bounties[_bountyId].balance,
               bounties[_bountyId].hasPaidOut);
   }

   /// @dev getBounty(): Returns the details of the bounty
   /// @param _bountyId the index of the bounty
   /// @return Returns a tuple for the bounty
   function getBountyFulfillments(uint _bountyId)
       public
       constant
       validateBountyArrayIndex(_bountyId)
       returns (Fulfillment[])
   {
       return (bounties[_bountyId].fulfillments);
   }

   /// @dev getBounty(): Returns the details of the bounty
   /// @param _bountyId the index of the bounty
   /// @return Returns a tuple for the bounty
   function getBountyApprovers(uint _bountyId)
       public
       constant
       validateBountyArrayIndex(_bountyId)
       returns (address[])
   {
       return (bounties[_bountyId].approvers);
   }

   /// @dev getBounty(): Returns the details of the bounty
   /// @param _bountyId the index of the bounty
   /// @return Returns a tuple for the bounty
   function getBountyContributions(uint _bountyId)
       public
       constant
       validateBountyArrayIndex(_bountyId)
       returns (Contribution[])
   {
       return (bounties[_bountyId].contributions);
   }

   /// @dev getNumBounties() returns the number of bounties in the registry
   /// @return Returns the number of bounties
   function getNumBounties()
       public
       constant
       returns (uint)
   {
       return bounties.length;
   }

   /// @dev getNumFulfillments() returns the number of fulfillments for a given milestone
   /// @return Returns the number of fulfillments
   function getBounties()
       public
       constant
       returns (Bounty[])
   {
       return bounties;
   }

}
