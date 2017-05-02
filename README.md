# StandardBounties

`Version 0.0.1`

1. [Description](#1-rationale)
2. [Requirements](#2-implementation)
3. [Installation](#3-installation)
4. [Usage](#4-usage)

A set of standard contracts to be used as interfaces for any kind of bounty, either qualitative or quantitative in nature.

Original concept & code by @mbeylin. Maintained by @gnsps & @mbeylin.

## 1. Rationale

Bounties can be used to facilitate transactions between two parties, where a quantitative task, qualitative task or artifact is being exchanged for ETH.

Code bug bounties are included here as an implemented extension of the generalized bounty and to serve as an example of a pure quantitative bounty that can automatically be paid out.

## 2. Implementation

The generalized bounty contract (StandardBounty.sol) is implemented as a State Machine as represented below:

![Bounties State Machine](/standardbountyfsm.png?raw=true "StandardBounty Finite State Machine")

All the extension bounty types **musn't** break the state diagram above. They should differ in validation of state change but not in transition rules.

### 2.1 Invariant check pattern for _CodeBugBounty.sol_




