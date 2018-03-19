# StandardBounties
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/bounties-network/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[ ![Codeship Status for ConsenSys/StandardBounties](https://app.codeship.com/projects/1e2726c0-ac83-0135-5579-52b4614bface/status?branch=master)](https://app.codeship.com/projects/257018)

`Version 1.1.0`

1. [Rationale](#1-rationale)
2. [Implementation](#2-implementation)
3. [Development](#3-development)
4. [Documentation](#4-documentation)

A set of standard contracts to be used as interfaces for any kind of bounty, either qualitative or quantitative in nature.

## 1. Rationale

Ethereum smart contracts can trivially facilitate transactions of resources (or tokens) between individuals or groups, but service transactions are more complex. Requesting individuals (issuers) must first approve the work they're receiving before paying out funds, meaning bounty hunters must have trust that the issuer will pay them in the spirit of the original contract.

The _StandardBounties.sol_ contract facilitates transactions on qualitative data (often representing artifacts of completion of some service), allowing bounty issuers to systematically approve the work they receive.


## 2. Implementation

A bounty can be used to pay amounts of ETH or a given token, based on the successful completion of the given task. The contract aims to reduce the necessary trust in the issuer by forcing them to deposit sufficient Ether (or tokens) to pay out the bounty at least once.

- A bounty begins by being issued, either through the `issueBounty()` function (which issues the bounty into draft stage), or `issueAndActivateBounty()`, which issues the bounty into the active stage

- In the `Draft` state, all bounty details can still be mutated.

  In this state, the various functions which can be called are:
    - `contribute()` [**ANYONE**]: contributes ETH (or tokens) to the bounty
    - `activateBounty()` [**ONLY ISSUER**]: This will activate the bounty
    - `killBounty()` [**ONLY ISSUER**]: This will kill the bounty

  As well as several functions to alter the bounty details:
    - `changeBountyDeadline()` [**ONLY ISSUER**]
    - `changeBountyData()` [**ONLY ISSUER**]
    - `changeBountyFulfillmentAmount()` [**ONLY ISSUER**]
    - `changeBountyArbiter()` [**ONLY ISSUER**]
    - `extendDeadline()` [**ONLY ISSUER**]
    - `transferIssuer()` [**ONLY ISSUER**]
    - `increasePayout()` [**ONLY ISSUER**]

- A bounty transitions to the `Active` state when the issuer calls `activateBounty()`, or if it was initially issued and activated.

  This is only possible if
  - the bounty hasn't expired (isn't past its deadline)
  - the bounty has sufficient funds to pay out at least once

  Once a bounty is `Active`, bounty hunters can submit fulfillments for it, and the bounty issuer can approve fulfillments to pay out the rewards.

  In this state, the various functions which can be called are:
    - `contribute()` [**ANYONE**]: contributes ETH (or tokens) to the bounty
    - `fulfillBounty()` [**ANYONE BUT ISSUER OR ARBITER**]:
    - `updateFulfillment()` [**ONLY FULFILLER**]
    - `acceptFulfillment()` [**ONLY ISSUER OR ARBITER**]:
    - `increasePayout()` [**ONLY ISSUER**]:
    - `transferIssuer()` [**ONLY ISSUER**]
    - `extendDeadline()` [**ONLY ISSUER**]
    - `killBounty()` [**ONLY ISSUER**]:

- A bounty transitions to the `Dead` state when the issuer calls `killBounty()`, which drains the bounty of its remaining balance.

  In this state, the only functions which can be called are:
  - `extendDeadline()` [**ONLY ISSUER**]
  - `activateBounty()` [**ONLY ISSUER**]


## 3. Development

Any application can take advantage of the bounties network registry, which is currently deployed on the Main Ethereum Network at `0x2af47a65da8cd66729b4209c22017d6a5c2d2400`, and on the Rinkeby network at `0xf209d2b723b6417cbf04c07e733bee776105a073`. The `BountiesNetwork.eth` name will also always resolve to the most up-to-date registry version for the StandardBounties contract.

#### Data Schema

For details on the data schema used for all JSON objects which are uploaded to IPFS, see [the schema](./docs/standardSchemas.md)

**If you're building on the StandardBounties and would like to add additional data fields, please submit a pull request on this repo.**

## 4. Documentation

For thorough documentation of all functions, see [the documentation](./docs/documentation.md)
