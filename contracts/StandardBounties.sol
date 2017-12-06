pragma solidity 0.4.18;
import "./inherited/HumanStandardToken.sol";

/// @title StandardBounties
/// @dev Used to pay out individuals or groups for task fulfillment through
/// stepwise work submission, acceptance, and payment
/// @author Mark Beylin <mark.beylin@consensys.net>, Gonçalo Sá <goncalo.sa@consensys.net>
contract StandardBounties {

  /*
   * Events
   */
  event BountyIssued(uint bountyId);
  event BountyActivated(uint bountyId, address issuer);
  event BountyFulfilled(uint bountyId, address indexed fulfiller, uint256 indexed _fulfillmentId);
  event FulfillmentUpdated(uint _bountyId, uint _fulfillmentId);
  event FulfillmentAccepted(uint bountyId, address indexed fulfiller, uint256 indexed _fulfillmentId);
  event BountyKilled(uint bountyId, address indexed issuer);
  event ContributionAdded(uint bountyId, address indexed contributor, address[] _tokenContracts, uint256[] value);
  event DeadlineExtended(uint bountyId, uint newDeadline);
  event BountyChanged(uint bountyId);
  event IssuerTransferred(uint _bountyId, address indexed _newIssuer);
  event PayoutIncreased(uint _bountyId, uint _tokenId, uint _newFulfillmentAmount);


  /*
   * Storage
   */

  Bounty[] public bounties;

  mapping(uint=>Fulfillment[]) fulfillments;
  mapping(uint=>HumanStandardToken[]) tokenContracts;
  mapping(uint=>mapping(address=> uint)) balances;
  mapping(uint=>mapping(address=>bool)) tokenContractHasBeenAdded;



  /*
   * Enums
   */

  enum BountyStages {
      Draft,
      Active,
      Dead
  }

  /*
   * Structs
   */

  struct Bounty {
      address issuer;
      uint deadline;
      string data;
      uint[] fulfillmentAmounts;
      address arbiter;
      BountyStages bountyStage;
      uint numAccepted;
  }

  struct Fulfillment {
      bool accepted;
      address fulfiller;
      string data;
  }

  /*
   * Modifiers
   */

  modifier validateNotTooManyBounties(){
    require((bounties.length + 1) > bounties.length);
    _;
  }

  modifier validateNotTooManyFulfillments(uint _bountyId){
    require((fulfillments[_bountyId].length + 1) > fulfillments[_bountyId].length);
    _;
  }

  modifier validateBountyArrayIndex(uint _bountyId){
    require(_bountyId < bounties.length);
    _;
  }

  modifier onlyIssuer(uint _bountyId) {
      require(msg.sender == bounties[_bountyId].issuer);
      _;
  }

  modifier onlyFulfiller(uint _bountyId, uint _fulfillmentId) {
      require(msg.sender == fulfillments[_bountyId][_fulfillmentId].fulfiller);
      _;
  }

  modifier sameLengths(address[] _tokenContracts, uint[] _values) {
     require(_tokenContracts.length == _values.length);
      _;
  }

  modifier isBeforeDeadline(uint _bountyId) {
      require(now < bounties[_bountyId].deadline);
      _;
  }

  modifier validateDeadline(uint _newDeadline) {
      require(_newDeadline > now);
      _;
  }

  modifier isAtStage(uint _bountyId, BountyStages _desiredStage) {
      require(bounties[_bountyId].bountyStage == _desiredStage);
      _;
  }

  modifier validateFulfillmentArrayIndex(uint _bountyId, uint _index) {
      require(_index < fulfillments[_bountyId].length);
      _;
  }

   modifier validateTokenArrayIndex(uint _bountyId, uint _tokenId){
      require(tokenContracts[_bountyId].length >= _tokenId);
      _;
  }

  modifier notYetAccepted(uint _bountyId, uint _fulfillmentId){
      require(fulfillments[_bountyId][_fulfillmentId].accepted == false);
      _;
  }

  modifier tokenContractsAllUnique(uint _bountyId, address[] _tokenContracts){
      for (uint256 i = 0; i < _tokenContracts.length; i++){
          require(tokenContractHasBeenAdded[_bountyId][_tokenContracts[i]] == false);
          tokenContractHasBeenAdded[_bountyId][_tokenContracts[i]] = true;
      }
      _;
  }
  modifier tokenContractIsNew(uint _bountyId, address _newTokenContract){
      require(!tokenContractHasBeenAdded[_bountyId][_newTokenContract]);
      _;
  }


  /*
   * Public functions
   */


  /// @dev issueBounty(): instantiates a new draft bounty
  /// @param _issuer the address of the intended issuer of the bounty
  /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
  /// @param _data the requirements of the bounty
  /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
  /// @param _arbiter the address of the arbiter who can mediate claims
  /// @param _tokenContracts the address of the contract if _paysTokens is true
  function issueBounty(
      address _issuer,
      uint _deadline,
      string _data,
      uint256[] _fulfillmentAmounts,
      address _arbiter,
      address[] _tokenContracts
  )
      public
      validateDeadline(_deadline)
      validateNotTooManyBounties
      tokenContractsAllUnique(bounties.length, _tokenContracts)
      sameLengths(_tokenContracts, _fulfillmentAmounts)

      returns (uint)
  {
      bounties.push(Bounty(_issuer, _deadline, _data, _fulfillmentAmounts, _arbiter, BountyStages.Draft, 0));

      for (uint256 i = 0; i < _tokenContracts.length; i++){
        tokenContracts[bounties.length - 1].push(HumanStandardToken(_tokenContracts[i]));
      }

      BountyIssued(bounties.length - 1);
      return (bounties.length - 1);
  }

  /// @dev issueAndActivateBounty(): instantiates a new draft bounty
  /// @param _issuer the address of the intended issuer of the bounty
  /// @param _deadline the unix timestamp after which fulfillments will no longer be accepted
  /// @param _data the requirements of the bounty
  /// @param _fulfillmentAmounts the amount of wei to be paid out for each successful fulfillment
  /// @param _arbiter the address of the arbiter who can mediate claims
  /// @param _tokenContracts the address of the contract if _paysTokens is true
  /// @param _values the total number of tokens being deposited upon activation
  function issueAndActivateBounty(
      address _issuer,
      uint _deadline,
      string _data,
      uint256[] _fulfillmentAmounts,
      address _arbiter,
      address[] _tokenContracts,
      uint256[] _values
  )
      public
      validateDeadline(_deadline)
      validateNotTooManyBounties
      sameLengths(_tokenContracts, _fulfillmentAmounts)
      sameLengths(_tokenContracts, _values)
      tokenContractsAllUnique(bounties.length, _tokenContracts)
      returns (uint)
  {
    bounties.push(Bounty(_issuer, _deadline, _data, _fulfillmentAmounts, _arbiter, BountyStages.Draft, 0));

    for (uint256 i = 0; i < _tokenContracts.length; i++){
        HumanStandardToken newTokenContract = HumanStandardToken(_tokenContracts[i]);
        if (_tokenContracts[i] == address(0x0)){
            require ((_values[i] * 1 wei) == msg.value);
        } else {
            uint oldBalance = newTokenContract.balanceOf(this);
            require(newTokenContract.transferFrom(msg.sender, this, _values[i]));
            require(newTokenContract.balanceOf(this) - oldBalance == _values[i]);
        }
        balances[bounties.length - 1][_tokenContracts[i]] = _values[i];
        require(_values[i] >= _fulfillmentAmounts[i]);
        tokenContracts[bounties.length - 1].push(newTokenContract);
    }

      BountyIssued(bounties.length - 1);
      return (bounties.length - 1);
  }

  modifier isNotDead(uint _bountyId) {
      require(bounties[_bountyId].bountyStage != BountyStages.Dead);
      _;
  }

  /// @dev contribute(): a function allowing anyone to contribute tokens to a
  /// bounty, as long as it is still before its deadline. Shouldn't keep
  /// them by accident (hence 'value').
  /// @param _bountyId the index of the bounty
  /// @param _value the amount being contributed in ether to prevent accidental deposits
  /// @notice Please note you funds will be at the mercy of the issuer
  ///  and can be drained at any moment. Be careful!
  function contribute (uint _bountyId, address[] _tokenContracts, uint[] _values)
      payable
      public
      validateBountyArrayIndex(_bountyId)
      isBeforeDeadline(_bountyId)
      isNotDead(_bountyId)
      sameLengths(_tokenContracts, _values)

  {
    for (uint256 i = 0; i < _tokenContracts.length; i++){
        HumanStandardToken newTokenContract = HumanStandardToken(_tokenContracts[i]);
        if ( _tokenContracts[i] == address(0x0)){
            require ((_values[i] * 1 wei) == msg.value);
        } else {
            uint oldBalance =  newTokenContract.balanceOf(this);
            require(newTokenContract.transferFrom(msg.sender, this, _values[i]));
            require(newTokenContract.balanceOf(this) - oldBalance == _values[i]);
        }
        balances[bounties.length - 1][_tokenContracts[i]] += _values[i];
    }

      ContributionAdded(_bountyId, msg.sender, _tokenContracts, _values);
  }

  /// @notice Send funds to activate the bug bounty
  /// @dev activateBounty(): activate a bounty so it may pay out
  /// @param _bountyId the index of the bounty
  /// @param _value the amount being contributed in ether to prevent
  /// accidental deposits
  function activateBounty (uint _bountyId, address[] _tokenContracts, uint[] _values)
      payable
      public
      validateBountyArrayIndex(_bountyId)
      isBeforeDeadline(_bountyId)
      onlyIssuer(_bountyId)
      sameLengths(_tokenContracts, _values)
  {
    for (uint256 i = 0; i < _tokenContracts.length; i++){
        HumanStandardToken newTokenContract = HumanStandardToken(_tokenContracts[i]);
        if ( _tokenContracts[i] == address(0x0)){
            require ((_values[i] * 1 wei) == msg.value);
        } else {
            uint oldBalance =  newTokenContract.balanceOf(this);
            require(newTokenContract.transferFrom(msg.sender, this, _values[i]));
            require(newTokenContract.balanceOf(this) - oldBalance == _values[i]);
        }
        balances[bounties.length - 1][_tokenContracts[i]] += _values[i];
    }
    for (uint256 j = 0; j < bounties[_bountyId].fulfillmentAmounts.length; j++){
        require(balances[_bountyId][tokenContracts[_bountyId][j]] >= bounties[_bountyId].fulfillmentAmounts[j]);
    }

    transitionToState(_bountyId, BountyStages.Active);

    ContributionAdded(_bountyId, msg.sender, _tokenContracts,  _values);
    BountyActivated(_bountyId, msg.sender);
  }


  modifier notIssuerOrArbiter(uint _bountyId) {
      require(msg.sender != bounties[_bountyId].issuer && msg.sender != bounties[_bountyId].arbiter);
      _;
  }

  /// @dev fulfillBounty(): submit a fulfillment for the given bounty
  /// @param _bountyId the index of the bounty
  /// @param _data the data artifacts representing the fulfillment of the bounty
  function fulfillBounty(uint _bountyId, string _data)
      public
      validateBountyArrayIndex(_bountyId)
      validateNotTooManyFulfillments(_bountyId)
      isAtStage(_bountyId, BountyStages.Active)
      isBeforeDeadline(_bountyId)
      notIssuerOrArbiter(_bountyId)
  {
      fulfillments[_bountyId].push(Fulfillment(false, msg.sender, _data));

      BountyFulfilled(_bountyId, msg.sender, (fulfillments[_bountyId].length - 1));
  }

  /// @dev updateFulfillment(): Submit updated data for a given fulfillment
  /// @param _bountyId the index of the bounty
  /// @param _fulfillmentId the index of the fulfillment
  /// @param _data the new data being submitted
  function updateFulfillment(uint _bountyId, uint _fulfillmentId, string _data)
      public
      validateBountyArrayIndex(_bountyId)
      validateFulfillmentArrayIndex(_bountyId, _fulfillmentId)
      onlyFulfiller(_bountyId, _fulfillmentId)
      notYetAccepted(_bountyId, _fulfillmentId)
  {
      fulfillments[_bountyId][_fulfillmentId].data = _data;
      FulfillmentUpdated(_bountyId, _fulfillmentId);
  }

  modifier onlyIssuerOrArbiter(uint _bountyId) {
      require(msg.sender == bounties[_bountyId].issuer ||
         (msg.sender == bounties[_bountyId].arbiter && bounties[_bountyId].arbiter != address(0)));
      _;
  }

  modifier fulfillmentNotYetAccepted(uint _bountyId, uint _fulfillmentId) {
      require(fulfillments[_bountyId][_fulfillmentId].accepted == false);
      _;
  }

  modifier enoughFundsToPay(uint _bountyId) {
    for (uint256 j = 0; j < bounties[_bountyId].fulfillmentAmounts.length; j++){
        require(balances[_bountyId][tokenContracts[_bountyId][j]] >= bounties[_bountyId].fulfillmentAmounts[j]);
    }
    _;
  }

  /// @dev acceptFulfillment(): accept a given fulfillment
  /// @param _bountyId the index of the bounty
  /// @param _fulfillmentId the index of the fulfillment being accepted
  function acceptFulfillment(uint _bountyId, uint _fulfillmentId)
      public
      validateBountyArrayIndex(_bountyId)
      validateFulfillmentArrayIndex(_bountyId, _fulfillmentId)
      onlyIssuerOrArbiter(_bountyId)
      isAtStage(_bountyId, BountyStages.Active)
      fulfillmentNotYetAccepted(_bountyId, _fulfillmentId)
      enoughFundsToPay(_bountyId)
  {
      fulfillments[_bountyId][_fulfillmentId].accepted = true;
      bounties[_bountyId].numAccepted++;
      for (uint256 i = 0; i < tokenContracts[_bountyId].length; i++){
        balances[_bountyId][tokenContracts[_bountyId][i]] -= bounties[_bountyId].fulfillmentAmounts[i];
        if (tokenContracts[_bountyId][i] == address(0x0)){
            require(tokenContracts[_bountyId][i].transfer(fulfillments[_bountyId][_fulfillmentId].fulfiller, bounties[_bountyId].fulfillmentAmounts[i]));
        } else {
            fulfillments[_bountyId][_fulfillmentId].fulfiller.transfer(bounties[_bountyId].fulfillmentAmounts[i]);
        }
      }
      FulfillmentAccepted(_bountyId, msg.sender, _fulfillmentId);
  }

  /// @dev killBounty(): drains the contract of it's remaining
  /// funds, and moves the bounty into stage 3 (dead) since it was
  /// either killed in draft stage, or never accepted any fulfillments
  /// @param _bountyId the index of the bounty
  function killBounty(uint _bountyId)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
  {
      transitionToState(_bountyId, BountyStages.Dead);
      for (uint i = 0; i < tokenContracts[_bountyId].length; i++){
            uint oldBalance = balances[_bountyId][tokenContracts[_bountyId][i]];
            balances[_bountyId][tokenContracts[_bountyId][i]] = 0;
            if (tokenContracts[_bountyId][i] == address(0x0)){
                require(tokenContracts[_bountyId][i].transfer(bounties[_bountyId].issuer, oldBalance));
            } else {
                bounties[_bountyId].issuer.transfer(oldBalance);
            }

      }
      BountyKilled(_bountyId, msg.sender);
  }

  modifier newDeadlineIsValid(uint _bountyId, uint _newDeadline) {
      require(_newDeadline > bounties[_bountyId].deadline);
      _;
  }

  /// @dev extendDeadline(): allows the issuer to add more time to the
  /// bounty, allowing it to continue accepting fulfillments
  /// @param _bountyId the index of the bounty
  /// @param _newDeadline the new deadline in timestamp format
  function extendDeadline(uint _bountyId, uint _newDeadline)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      newDeadlineIsValid(_bountyId, _newDeadline)
  {
      bounties[_bountyId].deadline = _newDeadline;

      DeadlineExtended(_bountyId, _newDeadline);
  }

  /// @dev transferIssuer(): allows the issuer to transfer ownership of the
  /// bounty to some new address
  /// @param _bountyId the index of the bounty
  /// @param _newIssuer the address of the new issuer
  function transferIssuer(uint _bountyId, address _newIssuer)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
  {
      bounties[_bountyId].issuer = _newIssuer;
      IssuerTransferred(_bountyId, _newIssuer);
  }


  /// @dev changeBountyDeadline(): allows the issuer to change a bounty's deadline
  /// @param _bountyId the index of the bounty
  /// @param _newDeadline the new deadline for the bounty
  function changeBountyDeadline(uint _bountyId, uint _newDeadline)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      validateDeadline(_newDeadline)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].deadline = _newDeadline;
      BountyChanged(_bountyId);
  }

  /// @dev changeData(): allows the issuer to change a bounty's data
  /// @param _bountyId the index of the bounty
  /// @param _newData the new requirements of the bounty
  function changeBountyData(uint _bountyId, string _newData)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].data = _newData;
      BountyChanged(_bountyId);
  }


  /// @dev changeBountyfulfillmentAmount(): allows the issuer to change a bounty's fulfillment amount
  /// @param _bountyId the index of the bounty
  /// @param _newFulfillmentAmount the new fulfillment amount
  function changeBountyFulfillmentAmount(uint _bountyId, uint _tokenId, uint _newFulfillmentAmount)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      validateTokenArrayIndex(_bountyId, _tokenId)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].fulfillmentAmounts[_tokenId] = _newFulfillmentAmount;
      BountyChanged(_bountyId);
  }

  /// @dev changeBountyArbiter(): allows the issuer to change a bounty's arbiter
  /// @param _bountyId the index of the bounty
  /// @param _newArbiter the new address of the arbiter
  function changeBountyArbiter(uint _bountyId, address _newArbiter)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      isAtStage(_bountyId, BountyStages.Draft)
  {
      bounties[_bountyId].arbiter = _newArbiter;
      BountyChanged(_bountyId);
  }

  /// @dev addNewToken(): allows the issuer to change a bounty's issuer
  /// @param _bountyId the index of the bounty
  /// @param _newPaysTokens the new bool for whether the contract pays tokens
  /// @param _newTokenContract the new address of the token

  function addNewToken(uint _bountyId, address _newTokenContract, uint _value)
      public
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      tokenContractIsNew(_bountyId, _newTokenContract)
  {
      tokenContractHasBeenAdded[_bountyId][_newTokenContract] = true;
      HumanStandardToken newTokenContract = HumanStandardToken(_newTokenContract);
      if (_value > 0){
          if (_newTokenContract == address(0x0)){
              require ((_value * 1 wei) == msg.value);
          } else {
              uint oldBalance =  newTokenContract.balanceOf(this);
              require(newTokenContract.transferFrom(msg.sender, this, _value));
              require(newTokenContract.balanceOf(this) - oldBalance == _value);
          }
          balances[_bountyId][_newTokenContract] = _value;
      }

      BountyChanged(_bountyId);
  }


  modifier newFulfillmentAmountIsIncrease(uint _bountyId, uint _tokenId, uint _newFulfillmentAmount) {
      require(bounties[_bountyId].fulfillmentAmounts[_tokenId] < _newFulfillmentAmount);
      _;
  }

  /// @dev increasePayout(): allows the issuer to increase a given fulfillment
  /// amount in the active stage
  /// @param _bountyId the index of the bounty
  /// @param _newFulfillmentAmount the new fulfillment amount
  /// @param _value the value of the additional deposit being added
  function increasePayout(uint _bountyId, uint _tokenId, uint _newFulfillmentAmount, uint _value)
      public
      payable
      validateBountyArrayIndex(_bountyId)
      onlyIssuer(_bountyId)
      validateTokenArrayIndex(_bountyId, _tokenId)
      newFulfillmentAmountIsIncrease(_bountyId, _tokenId, _newFulfillmentAmount)
  {
        if (_value > 0){
            if (tokenContracts[_bountyId][_tokenId] == address(0x0)){
                require ((_value * 1 wei) == msg.value);
            } else {
                uint oldBalance =  tokenContracts[_bountyId][_tokenId].balanceOf(this);
                require(tokenContracts[_bountyId][_tokenId].transferFrom(msg.sender, this, _value));
                require(tokenContracts[_bountyId][_tokenId].balanceOf(this) - oldBalance == _value);
            }
            balances[_bountyId][tokenContracts[_bountyId][_tokenId]] += _value;
        }

      require(balances[_bountyId][tokenContracts[_bountyId][_tokenId]] >= _newFulfillmentAmount);
      bounties[_bountyId].fulfillmentAmounts[_tokenId] = _newFulfillmentAmount;
      PayoutIncreased(_bountyId, _tokenId, _newFulfillmentAmount);
  }

  /// @dev getBounty(): Returns the details of the bounty
  /// @param _bountyId the index of the bounty
  /// @return Returns a tuple for the bounty
  function getBounty(uint _bountyId)
      public
      constant
      validateBountyArrayIndex(_bountyId)
      returns (address, uint, string, uint[], address, uint, HumanStandardToken[], uint, uint, uint[])
  {
      uint[] returnBalances;
      for (uint256 i = 0; i < tokenContracts[_bountyId].length; i++){
          returnBalances.push(balances[_bountyId][tokenContracts[_bountyId][i]]);
      }
      return (bounties[_bountyId].issuer,
              bounties[_bountyId].deadline,
              bounties[_bountyId].data,
              bounties[_bountyId].fulfillmentAmounts,
              bounties[_bountyId].arbiter,
              uint(bounties[_bountyId].bountyStage),
              tokenContracts[_bountyId],
              fulfillments[_bountyId].length,
              bounties[_bountyId].numAccepted,
              returnBalances);
  }

  /// @dev getNumBounties() returns the number of bounties in the registry
  /// @return Returns the number of bounties
  function getNumBounties()
      public
      constant
      returns (uint)
  {
      return bounties.length;
  }

  /// @dev getFulfillment(): Returns the fulfillment at a given index
  /// @param _bountyId the index of the bounty
  /// @param _fulfillmentId the index of the fulfillment to return
  /// @return Returns a tuple for the fulfillment
  function getFulfillment(uint _bountyId, uint _fulfillmentId)
      public
      constant
      validateBountyArrayIndex(_bountyId)
      validateFulfillmentArrayIndex(_bountyId, _fulfillmentId)
      returns (bool, address, string)
  {
      return (fulfillments[_bountyId][_fulfillmentId].accepted,
              fulfillments[_bountyId][_fulfillmentId].fulfiller,
              fulfillments[_bountyId][_fulfillmentId].data);
  }


  /*
   * Internal functions
   */

  /// @dev transitionToState(): transitions the contract to the
  /// state passed in the parameter `_newStage` given the
  /// conditions stated in the body of the function
  /// @param _bountyId the index of the bounty
  /// @param _newStage the new stage to transition to
  function transitionToState(uint _bountyId, BountyStages _newStage)
      internal
  {
      bounties[_bountyId].bountyStage = _newStage;
  }
}
