pragma solidity ^0.4.17;


/**
 * @title InstanceStorage
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @dev Defines kernel vars that Kernel contract share with Instance.
 *      Important to avoid overwriting wrong storage pointers is that 
 *      InstanceStorage should be always the first contract at heritance.
 */
contract InstanceStorage {    
    // protected zone start (InstanceStorage vars)
    address public kernel;
    // protected zone end
}