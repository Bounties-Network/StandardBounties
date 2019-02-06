pragma solidity ^0.4.18;
import "./inherited/Proxy.sol";
import "./StandardBounty.sol";

contract StandardBountiesFactory {

  event BountyCreated(uint _bountyId, address _contractAddress);

  StandardBounty[] public bounties;

  address public masterCopy;


  function StandardBountiesFactory(address _masterCopy)
  public
  {
    masterCopy = _masterCopy;
  }

  function createBounty(address _controller, address[] _approvers, string _data, uint _deadline, address _token, uint _tokenVersion)
  public
  {
    address newBounty = new Proxy(masterCopy);
    bounties.push(StandardBounty(newBounty));
    bounties[bounties.length - 1].initializeBounty(_controller, _approvers, _data, _deadline, _token, _tokenVersion);

    BountyCreated(bounties.length - 1, bounties[bounties.length - 1]);
  }

  function getNumBounties()
  public
  constant
  returns (uint)
  {
    return bounties.length;
  }
  function metaFulfill(bytes signature, address[] _fulfillers, string _data, uint256 nonce) public returns (bool) {
    bytes32 metaHash = keccak256(abi.encodePacked(address(this),"metaFulfill", _fulfillers, _data, _nonce));
    address signer = getSigner(metaHash,signature);
    //make sure signer doesn't come back as 0x0
    require(signer!=address(0));
    require(nonce == replayNonce[signer]);
    replayNonce[signer]++;
    internalFulfill(signer, to, value);

  }

  function internalFulfill(address _submitter, address[] _fulfillers, string _data)
      public
      validateNotTooManyFulfillments
  {
      require(now < deadline);

      fulfillments.push(Fulfillment(_fulfillers, false));

      BountyFulfilled((fulfillments.length - 1), msg.sender, _data);
  }


  function getSigner(bytes32 _hash, bytes _signature) internal pure returns (address){
    bytes32 r;
    bytes32 s;
    uint8 v;
    if (_signature.length != 65) {
      return address(0);
    }
    assembly {
      r := mload(add(_signature, 32))
      s := mload(add(_signature, 64))
      v := byte(0, mload(add(_signature, 96)))
    }
    if (v < 27) {
      v += 27;
    }
    if (v != 27 && v != 28) {
      return address(0);
    } else {
      return ecrecover(keccak256(
        abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)
      ), v, r, s);
    }
  }
}
