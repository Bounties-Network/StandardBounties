pragma solidity ^0.4.17;


/**
 * @title DelegatedCall
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Abstract contract that delegates calls by `delegated` modifier to result of `targetDelegatedCall()`
 *      Important to avoid overwriting wrong storage pointers is that never define storage to this contract
 */
contract DelegatedCall {
    /**
     * @dev delegates the call of this function
     */
    modifier delegated {
        //require successfull delegate call to remote `_target()`
        require(targetDelegatedCall().delegatecall(msg.data)); 
        assembly {
            let outSize := returndatasize 
            let outDataPtr := mload(0x40) //load memory
            returndatacopy(outDataPtr, 0, outSize) //copy last return into pointer
            return(outDataPtr, outSize) 
        }
        assert(false); //should never reach here
        _; //never will execute local logic
    }

    /**
     * @dev defines the address for delegation of calls
     */
    function targetDelegatedCall()
        internal
        constant
        returns(address);

}
