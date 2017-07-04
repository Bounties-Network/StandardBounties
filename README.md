# StandardBounties

`Version 0.0.1`

1. [Rationale](#1-rationale)
2. [Implementation](#2-implementation)
3. [Development](#3-development)

A set of standard contracts to be used as interfaces for any kind of bounty, either qualitative or quantitative in nature.

## 1. Rationale

Ethereum smart contracts can trivially facilitate transactions of resources (or tokens) between individuals or groups, but service transactions are more complex. Requesting individuals (issuers) must first approve the work they're receiving before paying out funds, meaning bounty hunters must have trust that the issuer will pay them in the spirit of the original contract.

The _StandardBounty.sol_ contract facilitates transactions on qualitative data (often representing artifacts of completion of some service), allowing bounty issuers to systematically approve the work they receive.


## 2. Implementation

A single bounty contract can be used to pay amounts of ETH or a given token, based on the successful completion of specific **Milestones**. The contract aims to reduce the necessary trust in the issuer by forcing them to deposit sufficient Ether (or tokens) to at minimum pay out each milestone once.

- A bounty begins in the `Draft` state, where the requirements, deadline, arbiter, and reward amounts can still be altered.

  In this state, the various functions which can be called are:
    - `contribute()`: This can be called by any individual to contribute ETH (or tokens) to the bounty
    - `activateBounty()`: This can only be called by the issuer, and will activate the bounty
    - `killBounty()`: This can only be called by the issuer, and will kill the bounty
    
  As well as several functions to alter the bounty details
    - `changeDeadline()`
    - `changeData()`
    - `changeContact()`
    - `changeArbiter()`
    - `changeFulfillmentAmounts()`

- A bounty transitions to the `Active` state when the issuer calls `activateBounty()`. This is only possible if
  - the bounty hasn't expired (isn't past its deadline)
  - the bounty has sufficient funds to pay out each milestone at least once

  Once a bounty is `Active`, bounty hunters can submit fulfillments for the various milestones, and the bounty issuer can approve fulfillments to pay out the rewards.

- A bounty transitions to the `Dead` state when the issuer calls `killBounty()`, which drains the contract of its balance, less the necessary funds to pay out fulfillments which have already been accepted but aren't yet paid out




### 2.1 Invariant check pattern for _CodeBugBounty.sol_

The pattern for invariant checks of bugs on smart contract code relies on the careful planning & implementation by the bounty creator.

If the invariants are not chosen correctly or their code is implemented poorly you'll probably just end up giving money away! Please be careful.

## 3. Development

All the extension bounty types (particular cases like _CodeBugBounty.sol_) **musn't** break the state diagram above. They should differ in validation of state change but not in transition rules.
