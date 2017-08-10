# StandardBounties Complete Documentation

`Version 0.0.1`


## Contract Details

### Storage

`address public issuer`
the creator of the bounty

`string public issuerContact`
This is used for the issuer to give participants an off-chain method of communication to maintain healthy contact.

`address public arbiter`
If the issuer chooses to allow for 3rd party mediation, they allow the arbiter to accept fulfillments on their behalf, and are disallowed from fulfilling the bounty.

`BountyStages public bountyStage`
Bounties are formed in the `Draft` stage, a period the issuer can use to edit any of the bounty elements, and attain sufficient funding. During the active stage requirements or payout amounts cannot be altered, however the deadline may be extended. Fulfillments can only be accepted in the `Active` stage, even if the deadline has passed. The issuer can kill the bounty returning all funds to them (less the amount due for already accepted but unpaid submissions), however this behaviour is highly discouraged and can hurt reputation.

`uint public deadline`
A bounty can only be contributed to, activated, or fulfilled before the given deadline. This deadline can be moved forward or backwards in the draft stage, but once the bounty is activated it can only be extended. This helps maintain the contractual nature of the relationship, where issuers cannot move deadlines forward arbitrarily while individuals are fulfilling the tasks.

`string public data`
All data representing the requirements are stored off-chain, and their hash is updated here. Requirements and auxiliary data are mutable while the bounty is in the `Active` stage, but becomes immutable when the bounty is activated, thereby "locking in" the terms of the contract, the requirements for acceptance for each milestone. These should be as rich as possible from the outset, to avoid conflicts stemming from task fulfillers believing they merited the bounty reward.

`uint public numMilestones`
The total number of milestones.

`uint[] public fulfillmentAmounts`
The total bounty amount is broken down into stepwise payments for each milestone, allowing different individuals to fulfill different pieces of a bounty task. This array stores the amount of wei (or ERC20 token) which will pay out when work is accepted.

`mapping(uint=>Fulfillment[]) public fulfillments`
Work is submitted and a hash is stored on-chain, allowing any deliverable to be submitted for the same bounty.

`mapping(uint=>uint) public numFulfillments`
The number of submissions for each milestone.

`mapping(uint=>uint) public numAccepted`
The number of submissions which have been accepted for each milestone.

`mapping(uint=>uint) public numPaid`
The number of submissions which have paid out to task fulfillers for each milestone.

### External functions

#### StandardBounty()
Instantiates the variables describing the bounty, while it is in the draft stage. The contract gives `tx.origin` the issuer privileges so that a factory design pattern can be used.
```
function StandardBounty(
    uint _deadline,
    string _contactInfo,
    string _data,
    uint[] _fulfillmentAmounts,
    uint _numMilestones,
    address _arbiter
)
    amountsNotZero(_fulfillmentAmounts)
    validateDeadline(_deadline)
    correctLengths(_numMilestones, _fulfillmentAmounts.length)
{
    issuer = tx.origin; //this allows for the issuance of a bounty using a factory
    issuerContact = _contactInfo;
    bountyStage = BountyStages.Draft;
    deadline = _deadline;
    data = _data;
    numMilestones = _numMilestones;
    arbiter = _arbiter;

    fulfillmentAmounts = _fulfillmentAmounts;
}
```

#### Contribute()
This allows a bounty to receive 3rd party contributions from the crowd. The Ether (or tokens) which are deposited are at the mercy of the issuer, who can at any point call `killBounty()` to drain remaining funds.
```
function contribute (uint value)
    payable
    isBeforeDeadline
    isNotDead
    amountIsNotZero(value)
    amountEqualsValue(value)
{
    ContributionAdded(msg.sender, msg.value);
}
```

#### ActivateBounty()
If the bounty has sufficient funds to pay out each milestone at least once, it can be activated, allowing individuals to add submissions.
```
function activateBounty(uint value)
    payable
    public
    isBeforeDeadline
    onlyIssuer
    amountEqualsValue(value)
    validateFunding
{
    transitionToState(BountyStages.Active);

    ContributionAdded(msg.sender, msg.value);
    BountyActivated(msg.sender);
}
```

#### FulfillBounty()
Once the bounty is active, anyone can fulfill it and submit the necessary deliverables for a given milestone (as long as the deadline has not passed). Anyone can fulfill the bounty, except for the issuer and arbiter, who are disallowed from doing so.
```
function fulfillBounty(string _data, string _dataType, uint _milestoneId)
    public
    isAtStage(BountyStages.Active)
    isBeforeDeadline
    checkFulfillmentsNumber(_milestoneId)
    notIssuerOrArbiter
{
    fulfillments[_milestoneId].push(Fulfillment(false, false, msg.sender, _data, _dataType));

    BountyFulfilled(msg.sender, numFulfillments[_milestoneId]++, _milestoneId);
}
```
#### AcceptFulfillment()
Submissions can be accepted by the issuer while the bounty is active, and the contract has sufficient funds to pay out all previously accepted submissions. Arbiters also have the ability to accept work, but should only do so after mediating between the issuer and fulfiller to resolve the conflict.
```
function acceptFulfillment(uint _fulfillmentId, uint _milestoneId)
    public
    onlyIssuerOrArbiter
    isAtStage(BountyStages.Active)
    validateMilestoneIndex(_milestoneId)
    validateFulfillmentArrayIndex(_fulfillmentId, _milestoneId)
    unpaidAmountRemains(_milestoneId)
{
    fulfillments[_milestoneId][_fulfillmentId].accepted = true;
    numAccepted[_milestoneId]++;

    FulfillmentAccepted(msg.sender, _fulfillmentId, _milestoneId);
}
```

#### FulfillmentPayment()
Once an individuals submission has been accepted, they can claim their reward, transferring the Ether (or tokens) to the successful fulfiller.
```
function fulfillmentPayment(uint _fulfillmentId, uint _milestoneId)
    public
    validateMilestoneIndex(_milestoneId)
    validateFulfillmentArrayIndex(_fulfillmentId, _milestoneId)
    onlyFulfiller(_fulfillmentId, _milestoneId)
    checkFulfillmentIsApprovedAndUnpaid(_fulfillmentId, _milestoneId)
{
    fulfillments[_milestoneId][_fulfillmentId].fulfiller.transfer(fulfillmentAmounts[_milestoneId]);
    fulfillments[_milestoneId][_fulfillmentId].paid = true;

    numPaid[_milestoneId]++;

    FulfillmentPaid(msg.sender, _fulfillmentId, _milestoneId);
}
```
#### KillBounty()
Once an individuals submission has been accepted, they can claim their reward, transferring the Ether (or tokens) to the successful fulfiller.
```
function killBounty()
    public
    onlyIssuer
{
    issuer.transfer(this.balance - unpaidAmount());

    transitionToState(BountyStages.Dead);

    BountyKilled();
}
```

#### ExtendDeadline()
The issuer of the bounty can extend the deadline at any time, allowing more time for submissions to be fulfilled.
```
function extendDeadline(uint _newDeadline)
    public
    onlyIssuer
    newDeadlineIsValid(_newDeadline)
{
    deadline = _newDeadline;

    DeadlineExtended(_newDeadline);
}
```

#### transferIssuer()
At any point, the issuer can transfer ownership of the bounty to a new address that they supply.
```
function transferIssuer(address _newIssuer)
public
onlyIssuer
{
  issuer = _newIssuer;
}
```

#### ChangeBounty()
The issuer of the bounty can change all bounty variables at once while the bounty is in the `Draft` stage.
```
function changeBounty(uint _newDeadline,
                      string _newContactInfo,
                      string _newData,
                      uint[] _newFulfillmentAmounts,
                      uint _newNumMilestones,
                      address _newArbiter)
    public
    onlyIssuer
    validateDeadline(_newDeadline)
    amountsNotZero(_newFulfillmentAmounts)
    correctLengths(_newNumMilestones, _newFulfillmentAmounts.length)
    isAtStage(BountyStages.Draft)
{
  deadline = _newDeadline;
  issuerContact = _newContactInfo;
  data = _newData;
  fulfillmentAmounts = _newFulfillmentAmounts;
  numMilestones = _newNumMilestones;
  arbiter = _newArbiter;
}
```

#### changeDeadline()
The issuer of the bounty can change the deadline however they wish while the bounty is in the `Draft` stage.
```
function changeDeadline(uint _newDeadline)
    public
    onlyIssuer
    validateDeadline(_newDeadline)
    isAtStage(BountyStages.Draft)
{
    deadline = _newDeadline;
}
```

#### changeData()
The issuer of the bounty can change the data (and requirements for acceptance) at any time while it is in `Draft` stage.
```
function changeData(string _newData)
    public
    onlyIssuer
    isAtStage(BountyStages.Draft)
{
    data = _newData;
}
```

#### changeContact()
The issuer of the bounty can change their contact information at any time while it is in `Draft` stage.
```
function changeContact(string _newContact)
    public
    onlyIssuer
    isAtStage(BountyStages.Draft)
{
    issuerContact = _newContact;
}
```

#### changeArbiter()
The issuer of the bounty can change the arbiter at any time while it is in `Draft` stage.
```
function changeArbiter(address _newArbiter)
    public
    onlyIssuer
    isAtStage(BountyStages.Draft)
{
    arbiter = _newArbiter;
}
```

#### changeFulfillmentAmounts()
The issuer of the bounty can change the payout amounts due for all milestones at once at any time while it is in `Draft` stage.
```
function changeFulfillmentAmounts(uint[] _newFulfillmentAmounts, uint _numMilestones)
    public
    onlyIssuer
    amountsNotZero(_newFulfillmentAmounts)
    correctLengths(_numMilestones, _newFulfillmentAmounts.length)
    isAtStage(BountyStages.Draft)
{
    fulfillmentAmounts = _newFulfillmentAmounts;
}
```

#### getFulfillment()
Returns all of the information describing a given fulfillment for a given milestone.
```
function getFulfillment(uint _fulfillmentId, uint _milestoneId)
    public
    constant
    returns (bool, bool, address, string, string)
{
    return (fulfillments[_milestoneId][_fulfillmentId].paid,
            fulfillments[_milestoneId][_fulfillmentId].accepted,
            fulfillments[_milestoneId][_fulfillmentId].fulfiller,
            fulfillments[_milestoneId][_fulfillmentId].data,
            fulfillments[_milestoneId][_fulfillmentId].dataType);
}
```
#### getBounty()
Returns a tuple of the variables describing the bounty.
```
function getBounty()
    public
    constant
    returns (address, string, uint, uint, string, uint)
{
    return (issuer,
            issuerContact,
            uint(bountyStage),
            deadline,
            data,
            numMilestones);
}
```

#### UnpaidAmount()
Returns the amount of wei which is owed for submissions which were already accepted.
```
function unpaidAmount()
    public
    constant
    returns (uint amount)
{
    for (uint i = 0; i < numMilestones; i++){
        amount += fulfillmentAmounts[i] * (numAccepted[i] - numPaid[i]);
    }
}
```

### Events

```event BountyActivated(address issuer);```
This is emitted when the bounty gets activated by the issuer

```event FulfillmentAccepted(address indexed fulfiller, uint256 indexed _fulfillmentId, uint256 indexed _milestoneId);```
This is emitted when the fulfillment for `_milestoneId` at index `_fulfillmentId` is accepted by the issuer.

```event FulfillmentPaid(address indexed fulfiller, uint256 indexed _fulfillmentId, uint256 indexed _milestoneId);```
This is emitted when the fulfillment or `_milestoneId` at index `_fulfillmentId` is paid out to the fulfiller.

```event BountyKilled();```
This is emitted when the issuer kills the bounty, draining the remaining funds

```event ContributionAdded(address indexed contributor, uint256 value);```
This is emitted when someone at address `contributor` contributes to the bounty

```event DeadlineExtended(uint newDeadline);```
This is emitted when the issuer extends the deadline of the bounty.
