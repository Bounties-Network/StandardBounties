pragma solidity ^0.4.17;

import "./common/Controlled.sol";
import "./deploy/Instance.sol";
import "./StandardBountyKernel.sol";

/** 
 * @title StandardBountyKernel
 * @dev Creates a StandardBounty to be used by Instance contract
 */
contract StandardBountyFactory is Controlled {

    event InstanceCreated(address indexed controller, address instance);

    StandardBountyKernel public standardBountyKernel;

    function StandardBountyFactory()
        public
    {
        standardBountyKernel = new StandardBountyKernel();
    }

    function drainKernel(address _destination, address[] _drainTokens) 
        external
        onlyController
    {
        standardBountyKernel.drainBounty(_destination, _drainTokens);
    }

    function createStandardBounty(uint _timeout) 
        external
    {
        createStandardBounty(msg.sender, _timeout);
    }

    function createStandardBounty(address _controller, uint _timeout) 
        public 
    {
        StandardBountyKernel instance = StandardBountyKernel(new Instance(address(standardBountyKernel)));
        instance.initStandardBounty(_controller, _timeout);
        InstanceCreated(_controller, address(instance));
    }


}