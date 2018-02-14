pragma solidity ^0.4.17;
import "./deploy/InstanceStorage.sol";
import "./StandardBounty.sol";


/** 
 * @title StandardBountyKernel
 * @dev Creates a StandardBounty to be used by Instance contract
 */
contract StandardBountyKernel is InstanceStorage, StandardBounty {
    
    function StandardBountyKernel() 
        StandardBounty(0)  
        public
    {
        state = State.FINALIZED; //enable manual recover of wrongly sent ERC20 tokens to Kernel contract
    }

    /**
     * @notice Instance constructor for StandardBounty.
     * @param _controller The controller of the StandardBounty 
     * @param _timeLimit Limit for withdrawing funds from the issue after its closed
     */
    function initStandardBounty(address _controller, uint256 _timeLimit) 
        external
    {
        require(controller == address(0)); //require clean instance
        require(_controller != address(0));
        controller = _controller;
        timeLimit = _timeLimit;
        state = State.OPEN;
        StateChanged(State.OPEN);
    }
    
}