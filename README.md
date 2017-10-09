# StandardBounties

`Version 1.0.0`

1. [Rationale](#1-rationale)
2. [Implementation](#2-implementation)
3. [Development](#3-development)
4. [Documentation](#4-documentation)

A set of standard contracts to be used as interfaces for any kind of bounty, either qualitative or quantitative in nature.

## 1. Rationale

Ethereum smart contracts can trivially facilitate transactions of resources (or tokens) between individuals or groups, but service transactions are more complex. Requesting individuals (issuers) must first approve the work they're receiving before paying out funds, meaning bounty hunters must have trust that the issuer will pay them in the spirit of the original contract.

The _StandardBounties.sol_ contract facilitates transactions on qualitative data (often representing artifacts of completion of some service), allowing bounty issuers to systematically approve the work they receive.


## 2. Implementation

A single bounty contract can be used to pay amounts of ETH or a given token, based on the successful completion of the given task. The contract aims to reduce the necessary trust in the issuer by forcing them to deposit sufficient Ether (or tokens) to at minimum pay out each milestone once.

- A bounty begins in the `Draft` state, where the requirements, deadline, arbiter, and reward amounts can still be altered.

  In this state, the various functions which can be called are:
    - `contribute()` [**ANYONE**]: contributes ETH (or tokens) to the bounty
    - `activateBounty()` [**ONLY ISSUER**]: This will activate the bounty
    - `killBounty()` [**ONLY ISSUER**]: This will kill the bounty

  As well as several functions to alter the bounty details:
    - `changeBountyDeadline()` [**ONLY ISSUER**]
    - `changeBountyData()` [**ONLY ISSUER**]
    - `changeBountyFulfillmentAmount()` [**ONLY ISSUER**]
    - `changeBountyArbiter()` [**ONLY ISSUER**]
    - `changeBountyPaysTokens()` [**ONLY ISSUER**]
    - `extendDeadline()` [**ONLY ISSUER**]

- A bounty transitions to the `Active` state when the issuer calls `activateBounty()`.

  This is only possible if
  - the bounty hasn't expired (isn't past its deadline)
  - the bounty has sufficient funds to pay out each milestone at least once

  Once a bounty is `Active`, bounty hunters can submit fulfillments for the various milestones, and the bounty issuer can approve fulfillments to pay out the rewards.

  In this state, the various functions which can be called are:
    - `fulfillBounty()` [**ANYONE BUT ISSUER OR ARBITER**]:
    - `updateFulfillment()` [**ONLY FULFILLER**]
    - `acceptFulfillment()` [**ONLY ISSUER OR ARBITER**]:
    - `fulfillmentPayment()` [**ONLY FULFILLER**]:
    - `increasePayout()` [**ONLY ISSUER**]:
    - `transferIssuer()` [**ONLY ISSUER**]
    - `extendDeadline()` [**ONLY ISSUER**]
    - `killBounty()` [**ONLY ISSUER**]:

- A bounty transitions to the `Dead` state when the issuer calls `killBounty()`, which drains the contract of its balance, less the necessary funds to pay out fulfillments which have already been accepted but aren't yet paid out.

  In this state, the only functions which can be called are:
  - `extendDeadline()` [**ONLY ISSUER**]
  - `contribute()` [**ANYONE**]
  - `activateBounty()` [**ONLY ISSUER**]


## 3. Development

Any application can take advantage of the bounties network registry, which is currently deployed on the Main Ethereum Network at `0x8c9fe49Cd196BDafCD0B7C3078fa9823d247564a`. The `bountiesnetwork.eth` name will also always resolve to the most up-to-date registry version for the Bounties Network.

#### Data Schema

StandardBounties employs an off-chain storage data model, where the `data` field of each bounty and fulfillment, is a hash of a JSON object, which is stored in a distributed manner on IPFS.
The schema for the bounty data field is:
```
{
  title: // A string representing the title of the bounty
  description: // A string representing the description of the bounty, including all requirements
  sourceFileName: // A string representing the name of the file
  sourceFileHash: // The IPFS hash of the file associated with the bounty
  contact: // A string representing the preferred contact method of the issuer of the bounty
  categories: // an array of strings, representing the categories of tasks which are being requested
}
```
The data schema for the fulfillment data field is:
```
{
  description: // A string representing the description of the fulfillment, and any necessary links to works
  sourceFileName: // A string representing the name of the file being submitted
  sourceFileHash: // A string representing the IPFS hash of the file being submitted
}
```

If you're building on the StandardBounties and would like to add additional data fields, please submit a pull request on this repo.

## 4. Documentation

For thorough documentation of all functions, see [the documentation](./docs/documentation.md)
