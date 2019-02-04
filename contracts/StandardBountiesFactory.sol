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

}
