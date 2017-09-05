# StandardBounties Complete Documentation

`Version 0.0.1`

## Summary

A bounty is a simple mechanism for individuals or groups to pay out for the completion of tasks. The issuer of the bounty begins by deploying a new bounty contract, during which time any of the storage variables (like bounty requirements or payout amounts) can be altered. Once sufficient funds have been deposited into the contract, the issuer may activate the bounty, allowing bounty hunters to submit fulfillments for the various milestones. The issuer can then approve the submitted work, releasing the payout funds to the bounty hunter in question.


## Contract Details

### Storage

`address public issuer`
The issuer is the creator of the bounty, and has full control over administering its rewards.

`address public arbiter`
The arbiter is an individual or contract who is able to accept fulfillments on the issuer's behalf. The arbiter is also disallowed from fulfilling the bounty.

`BountyStages public bountyStage`
Bounties are formed in the `Draft` stage, a period during which the issuer can edit any of the bounty's state variables, and attain sufficient funding. In the draft stage, no fulfillments can be submitted, and no funds can be paid out.

Once the bounty state variables are finalized, and the bounty contract holds sufficient funds to pay out each milestone at least once, it can be transitioned to the `Active` stage by only the issuer. During the active stage, requirements or payout amounts cannot be altered, however the deadline may be extended. Fulfillments can only be submitted in the `Active` stage before the deadline, although they may be accepted by the issuer or arbiter even after the deadline has passed.
At any point, the issuer can kill the bounty returning all funds to them (less the amount due for already accepted but unpaid submissions), transitioning the bounty into the `Dead` stage. However, this behaviour is highly discouraged and should be avoided at all costs.

`uint public deadline`
A bounty can only be contributed to, activated, or fulfilled before the given deadline, however fulfillments can be accepted even after the deadline has passed. This deadline can be moved forward or backwards in the draft stage, but once the bounty is activated it can only be extended. This helps maintain the contractual nature of the relationship, where issuers cannot move deadlines forward arbitrarily while individuals are fulfilling the tasks.

`string public data`
All data representing the requirements are stored off-chain, and their hash is updated here. Requirements and auxiliary data are mutable while the bounty is in the `Draft` stage, but becomes immutable when the bounty is activated, thereby "locking in" the terms of the contract, the requirements for acceptance for each milestone. These should be as rich as possible from the outset, to avoid conflicts stemming from task fulfillers believing they merited the bounty reward.

`uint[] public fulfillmentAmounts`
The total bounty amount is broken down into different payments for each milestone, allowing different individuals to fulfill different pieces of a bounty task. This array stores the amount of wei (or ERC20 token) which will pay out for each milestone when work is accepted. The length of this array is the number of milestones.

`mapping(uint=>Fulfillment[]) public fulfillments`
Work is submitted and a hash is stored on-chain, allowing any deliverable to be submitted for the same bounty.


`mapping(uint=>uint) public numAccepted`
The number of submissions which have been accepted for each milestone.

`mapping(uint=>uint) public numPaid`
The number of submissions which have paid out to task fulfillers for each milestone. `numPaid[i]` is always less than or equal to `numAccepted[i]`.

### External functions

#### StandardBounty()
Constructs the bounty and instantiates state variables, initializing it in the draft stage. The contract gives `tx.origin` the issuer privileges so that a factory design pattern can be used. The bounty deadline must be after the time of issuance (contract deployment), and none of the milestones can pay out 0 tokens.
```
function StandardBounty(
    uint _deadline,
    string _contactInfo,
    string _data,
    uint256[] _fulfillmentAmounts,
    uint _totalFulfillmentAmounts,
    uint _numMilestones,
    address _arbiter
)
    amountsNotZeroAndEqualSum(_fulfillmentAmounts, _totalFulfillmentAmounts)
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
    totalFulfillmentAmounts = _totalFulfillmentAmounts;
}
```

#### Contribute()
This allows a bounty to receive 3rd party contributions from the crowd. This functionality is only available before the deadline has passed, and while the bounty is not in the `Dead` stage. The Ether (or tokens) which are deposited are at the mercy of the issuer, who can at any point call `killBounty()` to drain remaining funds.
```
function contribute (uint value)
    payable
    isBeforeDeadline
    isNotDead
    amountIsNotZero(value)
    amountEqualsValue(value)
{
    ContributionAdded(msg.sender, value);
}
```

#### ActivateBounty()
If the bounty has sufficient funds to pay out each milestone at least once, it can be activated, allowing individuals to add submissions. Only the issuer is allowed to activate their bounty.
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
    validateMilestoneIndex(_milestoneId)
    checkFulfillmentsNumber(_milestoneId)
    notIssuerOrArbiter
{
    fulfillments[_milestoneId].push(Fulfillment(false, false, msg.sender, _data, _dataType));

    BountyFulfilled(msg.sender, numFulfillments[_milestoneId]++, _milestoneId);
}
```

#### updateFulfillment()
After a bounty has been fulfilled, the data representing the fulfillment deliverables can be changed or updated by the fulfiller, but only before the bounty has been accepted or paid. Individuals may only update the fulfillments which they personally submitted.
```
function updateFulfillment(string _data, uint _milestoneId, uint _fulfillmentId)
public
validateMilestoneIndex(_milestoneId)
validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
onlyFulfiller(_milestoneId, _fulfillmentId)
notYetAccepted(_milestoneId, _fulfillmentId)
{
  fulfillments[_milestoneId][_fulfillmentId].data = _data;
}
```

#### AcceptFulfillment()
Submissions can be accepted by the issuer while the bounty is active, and the contract has sufficient funds to pay out all previously accepted submissions. Arbiters also have the ability to accept work, but should only do so after mediating between the issuer and fulfiller to resolve the conflict.

```
function acceptFulfillment(uint _milestoneId, uint _fulfillmentId)
    public
    onlyIssuerOrArbiter
    isAtStage(BountyStages.Active)
    validateMilestoneIndex(_milestoneId)
    validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
    unpaidAmountRemains(_milestoneId)
{
    fulfillments[_milestoneId][_fulfillmentId].accepted = true;
    numAccepted[_milestoneId]++;

    FulfillmentAccepted(msg.sender, _milestoneId, _fulfillmentId);
}
```

#### FulfillmentPayment()
Once an individuals submission has been accepted, they can claim their reward, transferring the Ether (or tokens) to the successful fulfiller. A payment can only be claimed once for each fulfillment which has been accepted.
```
function fulfillmentPayment(uint _milestoneId, uint _fulfillmentId)
    public
    validateMilestoneIndex(_milestoneId)
    validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
    onlyFulfiller(_milestoneId, _fulfillmentId)
    checkFulfillmentIsApprovedAndUnpaid(_milestoneId, _fulfillmentId)
{
    fulfillments[_milestoneId][_fulfillmentId].fulfiller.transfer(fulfillmentAmounts[_milestoneId]);
    fulfillments[_milestoneId][_fulfillmentId].paid = true;

    numPaid[_milestoneId]++;

    FulfillmentPaid(msg.sender, _milestoneId, _fulfillmentId);
}
```

#### KillBounty()
The issuer of the bounty can transition it into the `Dead` stage at any point in time, draining the contract of all remaining funds (less the amount still due for successful fulfillments which are yet unpaid).
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
At any point, the issuer can transfer ownership of the bounty to a new address that they supply. This gives full power and authority to the new issuer address, and releases the old issuer address from the ability to administer the bounty.
```
function transferIssuer(address _newIssuer)
public
onlyIssuer
{
  issuer = _newIssuer;
}
```

#### ChangeBounty()
The issuer of the bounty can change all bounty variables at once while the bounty is in the `Draft` stage. This is not allowed when the bounty is in the `Active` or `Dead` stage.
```
function changeBounty(uint _newDeadline,
                      string _newContactInfo,
                      string _newData,
                      uint[] _newFulfillmentAmounts,
                      uint _totalFulfillmentAmounts,
                      uint _newNumMilestones,
                      address _newArbiter)
    public
    onlyIssuer
    validateDeadline(_newDeadline)
    amountsNotZeroAndEqualSum(_newFulfillmentAmounts, _totalFulfillmentAmounts)
    correctLengths(_newNumMilestones, _newFulfillmentAmounts.length)
    isAtStage(BountyStages.Draft)
{
  deadline = _newDeadline;
  issuerContact = _newContactInfo;
  data = _newData;
  fulfillmentAmounts = _newFulfillmentAmounts;
  totalFulfillmentAmounts = _totalFulfillmentAmounts;
  numMilestones = _newNumMilestones;
  arbiter = _newArbiter;
}
```

#### getFulfillment()
Returns all of the information describing a given fulfillment for a given milestone.
```
function getFulfillment(uint _milestoneId, uint _fulfillmentId)
    public
    constant
    validateMilestoneIndex(_milestoneId)
    validateFulfillmentArrayIndex(_milestoneId, _fulfillmentId)
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
Returns the amount of wei or tokens which are owed for submissions which were already accepted, but have not yet been paid.
```
function unpaidAmount()
    public
    constant
    returns (uint amount)
{
    for (uint i = 0; i < numMilestones; i++){
        amount = SafeMath.add(amount, SafeMath.mul(fulfillmentAmounts[i], SafeMath.sub(numAccepted[i], numPaid[i])));
    }
}
```

#### getNumFulfillments()
Returns the number of fulfillments which have been submitted for a given milestone
```
function getNumFulfillments(uint _milestoneId)
    public
    constant
    validateMilestoneIndex(_milestoneId)
    returns (uint)
{
    return fulfillments[_milestoneId].length;
}
```

#### unpaidAmount()
Returns the amount of ETH or tokens which must still be paid out for previously accepted fulfillments.
```
function unpaidAmount()
    public
    constant
    returns (uint amount)
{
    for (uint i = 0; i < fulfillmentAmounts.length; i++){
        amount = (amount + (fulfillmentAmounts[i]* (numAccepted[i]- numPaid[i])));
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
