pragma solidity ^0.4.8;

/*
  Standard Bounty contract, can be used to facilitate transactions on qualitative data
*/


contract StandardBounty{

  address public issuer; //the creator of the bounty
  //is this needed?
  uint public bountyStage; // the stage of the bounty: 0 for draft, 1 for active, 2 for fulfilled, 3 for dead bounties (past deadline with no accepted fulfillments)

  uint public deadline; //unix timestamp for deadline
  string public data; //data representing the requirements for the bounty, and any associated files - this is commonly an IPFS hash but in reality could be anything the bounty creator desires


  uint public fulfillmentAmount; // the amount of wei to be rewarded to the user who fulfills the bounty
  bool public fulfillmentApproval; // whether or not a fulfillment must be approved before the bounty can be claimed

  Fulfillment[] public fulfillments; // the list of submitted fulfillments
  uint public numFulfillments; // the number of submitted fulfillments

  Fulfillment[] public accepted; // the list of accepted fulfillments
  uint public numAccepted; // the number of accepted fulfillments




  struct Fulfillment {
    address fulfiller;
    string data;
    string dataType;
  }

  /*
  Bounty():
  instantiates a new draft bounty, activating it if sufficient funds exist to pay out the bounty
  _deadline: the unix timestamp after which fulfillments will no longer be accepted
  _data: the requirements of the bounty
  _fulfillmentAmount: the amount of wei to be paid out for each successful fulfillment
  _fulfillmentApproval: whether or not a fulfillment must be approved for one to claim the reward
  _activateNow: Whether the issuer wishes to activate the bounty now (assuming sufficient funds are held) or wait until a later date to activate it
  */

  function Bounty(uint _deadline, string _data, uint _fulfillmentAmount, bool _fulfillmentApproval, bool _activateNow) payable {
    issuer = msg.sender;
    bountyStage = 0; //automatically in draft stage

    deadline = _deadline;
    data = _data;

    fulfillmentApproval = _fulfillmentApproval;
    fulfillmentAmount = _fulfillmentAmount;

    numFulfillments = 0;
    numAccepted = 0;

    if (msg.value >= _fulfillmentAmount && _activateNow){
        bountyStage = 1; // Sender supplied bounty with sufficient funds
    }

  }
  /*
  addFundsToActivateBounty():
  adds more funds to a bounty so it may continue to pay out to fulfillers
  */
  function addFundsToActivateBounty() payable {
    if (block.timestamp >= deadline) throw;
    if (this.balance >= fulfillmentAmount && msg.sender == issuer){
        bountyStage = 1;
    }
  }
  /*
  fulfillBounty():
  submit a fulfillment for the given bounty, while also claiming the reward (if approval isn't required)
  _data: the data artifacts representing the fulfillment of the bounty
  _dataType: a meaningful description of the type of data the fulfillment represents
  */
  function fulfillBounty(string _data, string _dataType){
    if (msg.sender != issuer || block.timestamp > deadline) throw;

      fulfillments[numFulfillments] = Fulfillment(msg.sender, _data, _dataType);
      numFulfillments ++;

      if (!fulfillmentApproval){ //fulfillment doesn't need to be approved to pay out
        if (!msg.sender.send(fulfillmentAmount)) throw;
        if (this.balance < fulfillmentAmount){
          bountyStage = 2;
        }
      }
  }

  /*
  acceptFulfillment():
  accept a given fulfillment, and send the fulfiller their owed funds
  fulNum: the index of the fulfillment being accepted
  */
  function acceptFulfillment(uint fulNum){
    if (msg.sender!= issuer) throw;
    if (bountyStage != 1) throw;
    if (fulNum >= numFulfillments) throw;

    accepted[numAccepted] = fulfillments[fulNum];
    numAccepted ++;

    if (!fulfillments[fulNum].fulfiller.send(fulfillmentAmount)) throw;

    if (this.balance < fulfillmentAmount){
      bountyStage = 2;
      if (!issuer.send(this.balance)) throw;
    }

  }

  /*
  reclaimBounty():
  drains the contract of it's remaining funds, and moves the bounty into stage 3 (dead)
  since it was either killed in draft stage, or never accepted any fulfillments
  */

  function reclaimBounty(){

    if (bountyStage == 0 || bountyStage == 1){
      bountyStage = 3;
    }
    if (!issuer.send(this.balance)) throw;

  }


}
