pragma solidity ^0.4.11;
import "StandardBounty.sol";



/// @title Bountied
/// @dev Contract to be tested and that should disburse the
/// `fulfillmentAmount` if it is sees its invariant truths broken
/// @author Gonçalo Sá <goncalo.sa@consensys.net>, Mark Beylin <mark.beylin@consensys.net>
contract Bountied {
    /// @dev checkInvariant(): function definition of a function that
    /// returns a boolean of constant truths you wish to maintain in
    /// this logical copy of your bountied contract

    StandardBounty public bounty;

    address issuer;



    function bountied(){
        issuer = msg.sender;
    }


    function setContract(address _bountyAddr)
    onlyIssuer
    {
        bounty = StandardBounty(_bountyAddr);
    }


    function checkInvariant() returns(bool){
      /*

        if (uint(bounty.bountyStage()) == 0){
            for (uint i = 0; i < bounty.numMilestones(); i++){
                if (bounty.numFulfillments(i) != 0 ||
                    bounty.numAccepted(i) != 0 ||
                    bounty.numPaid(i) != 0)
                    return false;
            }

        } else if (uint(bounty.bountyStage()) == 1){
            for (i = 0; i < bounty.numMilestones(); i++){
                uint realAccepted = 0;
                uint realPaid = 0;
                for (uint j = 0; j < bounty.numFulfillments(i); j++){
                    var(p,a,b,c,d) = bounty.fulfillments(i, j);
                    if (a)
                        realAccepted ++;
                    if (p)
                        realPaid ++;
                }
                if (bounty.numFulfillments(i) < bounty.numAccepted(i) ||
                    bounty.numFulfillments(i) < bounty.numPaid(i) ||
                    bounty.numAccepted(i) < bounty.numPaid(i) ||
                    realAccepted != bounty.numAccepted(i) ||
                    realPaid != bounty.numPaid(i))
                    return false;
            }
            if (this.balance < bounty.unpaidAmount())
                    return false;

        } else if (uint(bounty.bountyStage()) == 2){

            if (this.balance < bounty.unpaidAmount())
                    return false;
        } else {
            return false;
        }
*/
        return true;
    }


}
