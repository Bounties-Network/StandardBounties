# StandardBounties Data Schemas

## Summary

In an effort to manage the use of StandardBounties across several platforms, the schemas of the various `data` objects have been standardized.


## version 1.0

Bounty issuance `data` Schema:
```
{
  payload: {
    title: // a string representing the title of the bounty
    description: // a string representing the description of the bounty, including all requirements
    fulfillmentAmount: // an integer amount that will be paid out to fufillers
    categories: // an array of strings, representing the categories of tasks which are being requested
    expectedRevisions: // an integer of how many times the spec is expected to be adjusted during fulfillment
    difficulty: // a string representing how difficult this bounty is (one of: easy, medium, hard)
    privateFulfillments: // boolean desrcibing whether fulfillments are only visible to the issuer
    fulfillersNeedApproval: // boolean that forces users to be approved before fulfilling the bounty

    // ------- add optional fields here -------
    ipfsFilename: // a string representing the name of the file
    ipfsHash: // the IPFS hash of the directory which can be used to access the file
    webReferenceURL: // the link to a relevant web reference (ie github issue)
  },
  meta: {
    platform: // a string representing the original posting platform (ie 'gitcoin')
    schemaVersion: // a string representing the version number (ie '0.1')
    schemaName: // a string representing the name of the schema (ie 'standardSchema' or 'gitcoinSchema')
  }
}
```

Bounty fulfillment `data` Schema:
```
{
  payload: {
    description: // A string representing the description of the fulfillment, and any necessary links to works
    sourceFileName: // A string representing the name of the file being submitted
    sourceFileHash: // A string representing the IPFS hash of the file being submitted
    sourceDirectoryHash: // A string representing the IPFS hash of the directory which holds the file being submitted
    fulfillers: [
      // a list of personas for the individuals whose work is being submitted
    ]
    payoutAmounts: [
      // an array of floats which is equal in length to the fulfillers array, representing the % of tokens which should be paid to each of the fulfillers (ie [50, 50] would represent an equal split of a bounty by 2 fulfillers)
    ]

    // ------- add optional fields here -------
  },
  meta: {
    platform: // a string representing the original posting platform (ie 'gitcoin')
    schemaVersion: // a string representing the version number (ie '0.1')
    schemaName: // a string representing the name of the schema (ie 'standardSchema' or 'gitcoinSchema')
  }
}
```
## version 0.1
last changed: 19/01/22

Persona Schema:
```
{
   name: // optional - A string representing the name of the persona
   email: // optional - A string representing the preferred contact email of the persona
   githubUsername: // optional - A string representing the github username of the persona
   address: // required - A string web3 address of the persona
}
```
Bounty issuance `data` Schema:
```
{
  payload: {
    title: // A string representing the title of the bounty
    description: // A string representing the description of the bounty, including all requirements
    issuer: {
       // persona for the issuer of the bounty
    },
    funders:[
       // array of personas of those who funded the issue.
    ],
    categories: // an array of strings, representing the categories of tasks which are being requested
    created: // the timestamp in seconds when the bounty was created
    tokenSymbol: // the symbol for the token which the bounty pays out
    tokenAddress: // the address for the token which the bounty pays out (0x0 if ETH)

    // ------- add optional fields here -------
    sourceFileName: // A string representing the name of the file
    sourceFileHash: // The IPFS hash of the file associated with the bounty
    sourceDirectoryHash: // The IPFS hash of the directory which can be used to access the file
    webReferenceURL: // The link to a relevant web reference (ie github issue)
  },
  meta: {
    platform: // a string representing the original posting platform (ie 'gitcoin')
    schemaVersion: // a string representing the version number (ie '0.1')
    schemaName: // a string representing the name of the schema (ie 'standardSchema' or 'gitcoinSchema')
  }
}
```
Bounty fulfillment `data` Schema:
```
{
  payload: {
    description: // A string representing the description of the fulfillment, and any necessary links to works
    sourceFileName: // A string representing the name of the file being submitted
    sourceFileHash: // A string representing the IPFS hash of the file being submitted
    sourceDirectoryHash: // A string representing the IPFS hash of the directory which holds the file being submitted
    fulfiller: {
      // persona for the individual whose work is being submitted
    }

    // ------- add optional fields here -------
  },
  meta: {
    platform: // a string representing the original posting platform (ie 'gitcoin')
    schemaVersion: // a string representing the version number (ie '0.1')
    schemaName: // a string representing the name of the schema (ie 'standardSchema' or 'gitcoinSchema')
  }
}
```

### version 0.0
last changed: 19/12/17
```
{
  title: // A string representing the title of the bounty
  description: // A string representing the description of the bounty, including all requirements
  sourceFileName: // A string representing the name of the file
  sourceFileHash: // The IPFS hash of the file associated with the bounty
  contact: // A string representing the preferred contact method of the issuer of the bounty
  categories: // an array of strings, representing the categories of tasks which are being requested
  githubLink: // The link to the relevant repository
}
```
