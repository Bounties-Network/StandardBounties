# StandardBounties Complete Documentation

`Version 0.0.1`


## Contract Details

### External functions




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
