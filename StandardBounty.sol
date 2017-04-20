pragma solidity ^0.4.8;

/*
  Standard Bounty contract, can be used to facilitate transactions on qualitative data
*/


contract StandardBounty{

  address public issuer; //the creator of the bounty
  uint public bountyStage; // the stage of the bounty: 0 for draft, 1 for active, 2 for fulfilled, 3 for dead bounties (past deadline with no accepted fulfillments)
  uint public deadline; //unix timestamp for deadline
  string public data; //data representing the requirements for the bounty, and any associated files - this is commonly an IPFS hash but in reality could be anything the bounty creator desires


  uint public fulfillmentAmount; // the amount of wei to be rewarded to the user who fulfills the bounty
  bool public fulfillmentApproval; // whether or not a fulfillment must be approved before the bounty can be claimed
  Fulfillment[] public fulfillments; // the list of submitted fulfillments
  uint public numFulfillments;
  Fulfillment public selected;




  struct Fulfillment {
    address fulfiller;
    string data;
    string dataType;
  }

  function Bounty(uint _deadline, string _data, uint _fulfillmentAmount, bool _fulfillmentApproval) payable {
    issuer = msg.sender;
    bountyStage = 0;

    deadline = _deadline;
    data = _data;

    fulfillmentApproval = _fulfillmentApproval;
    fulfillmentAmount = _fulfillmentAmount;

    numFulfillments = 0;


    if (msg.value > 0){
      if (msg.value != (_fulfillmentAmount)){
        throw;
      }
      fulfillmentApproval = _fulfillmentApproval;
      bountyStage = 1;

    }

  }
  function activateBounty(uint _fulfillmentAmount) payable {
    if (bountyStage != 0 ||
        msg.sender != issuer ||
        (msg.value + this.balance) <  _fulfillmentAmount) throw;

      fulfillmentAmount = _fulfillmentAmount;
      bountyStage = 1;


  }
  function fulfillBounty(string _data, string _dataType){
    if (msg.sender == issuer && block.timestamp < deadline) {

      numFulfillments ++;
      Fulfillment newFul = fulfillments[numFulfillments];
      newFul.data = _data;
      newFul.dataType = _dataType;
      newFul.fulfiller = msg.sender;

    } else {
      throw;
    }
  }

  function acceptFulfillment(uint fulNum){
    if (msg.sender!= issuer) throw;
    if (bountyStage != 1) throw;
    if (fulNum >= numFulfillments) throw;

    selected = fulfillments[fulNum];
    bountyStage = 2;

  }
  function claimBounty(uint fulNum){
    if (!fulfillmentApproval){

    } else {
      if (msg.sender != selected.fulfiller) throw;
    }


    if (!msg.sender.send(fulfillmentAmount)) throw;
  }
  function reclaimBounty(){
    if (msg.sender!= issuer) throw;
    if (bountyStage != 1) throw;

    if (!msg.sender.send(this.balance)) throw;
    bountyStage = 3;
  }

}
