pragma solidity ^0.4.17;

import "./InstanceStorage.sol";
import "./DelegatedCall.sol";

/**
 * @title Instance
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Contract that forward everything through delegatecall to defined kernel
 */
contract Instance is InstanceStorage, DelegatedCall {

    function Instance(address _kernel) public {
        kernel = _kernel;
    }

    /**
     * @dev delegatecall everything (but declared functions) to `_target()`
     * @notice Verify `kernel()` code to predict behavior
     */
    function () external delegated {
        //all goes to kernel
    }

    /**
     * @dev returns kernel if kernel that is configured
     * @return kernel address
     */
    function targetDelegatedCall()
        internal
        constant
        returns(address)
    {
        return kernel;
    }


}