pragma solidity ^0.4.17;
import "./token/Token.sol";
import "./token/ApproveAndCallFallBack.sol";
import "./common/Controlled.sol";

/** 
 * @title StandardBounties
 * @dev Used to pay out individuals or groups for task fulfillment
 */
contract StandardBounty is Controlled {
    
    /////
    // Storage
    
    enum State { OPEN, REFUND, REWARD, FINALIZED }

    State public state; //current contract state
    uint256 public influenceTotal; //total influences given
    uint256 public closedAt; // timestamp of issue closing
    uint256 public timeLimit; // time limit of issue refund/withdraw

    mapping(address => uint256) public balances; // token deposits (address 0x0 is ether)
    mapping(address => uint256) public influence; // infleunce each address obtained
    mapping(bytes32 => uint256) public contribution;  //contribution amount of keccak256(address contributor, address token)
    mapping(bytes32 => bool) public rewarded; //reward flag for keccak256(address beneficiary, address token)

    /////
    // Modifiers

    modifier requiredState(State _state) {
        require(state == _state);
        _;
    }

    modifier timedOut {
        require(closedAt > 0);
        require(closedAt + timeLimit > block.timestamp);
        _;
    }
    
    /////
    // Events

    event StateChanged(State state);
    event ApprovedReward(address indexed destination, uint influence);
    event BalanceChanged(address indexed token, uint256 total);
    
    /////
    // Public and external functions
    
    /**
     * @notice Constructor
     * @param _timeLimit Limit for withdrawing funds from the issue after its closed
     */
    function StandardBounty(uint256 _timeLimit) 
        public
    {
        timeLimit = _timeLimit;
        state = State.OPEN;
        StateChanged(State.OPEN);
    }

    // ApproveAndCallFallBack.sol implementation
    
    /**
     * @notice Recieve approval from some token. 
     * @dev We can trust any token here, because token operations are isolated for each token.
     *      Any msg.sender is accepted, because we are using only approved value and `_data` is not used.
     * @param _from Address that approved spent form this contract
     * @param _amount Amount approved
     * @param _token Address of token approved
     * @param _data Must be empty
     */
    function receiveApproval(address _from, uint256 _amount, address _token, bytes _data)
        external 
    {
        require(_data.length == 0);
        contributeToken(_from, _amount, _token);
    }

    // Functions that can be called at `state = State.OPEN`

    /** 
     * @notice Request the transfer of `_token` to the bounty and register or register the ether sent
     * @param _contributor Address that approved spend from this contract
     * @param _amount Amount approved
     * @param _token Address of token approved
     */
    function contributeToken(address _contributor, uint _amount, address _token)
        public
        requiredState(State.OPEN)
    {
        require(_amount > 0);
        require (_token != address(0));
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        contribution[keccak256(_contributor, _token)] += _amount;
        balances[_token] += _amount;
        BalanceChanged(_token, balances[_token]);
    }

    /**
     * @notice Contributes ether to this bounty
     */
    function ()
        external
        payable
        requiredState(State.OPEN)
    {
        contribution[keccak256(msg.sender, address(0))] += msg.value;
        balances[address(0)] += msg.value;
        BalanceChanged(address(0), this.balance);
    }

    /**
     * @notice Update the balance of `_token` to be recognized by reward function
     *         this will not enable refund of this token, which in case of REFUND 
     *         state will be available for controller in FINALIZED state.
     * @param _token the token being queried balance
     */
    function updateBalance(address _token)
        external
        requiredState(State.OPEN)
    {
        require(_token != address(0));
        uint tokenBalance = Token(_token).balanceOf(address(this));
        if (tokenBalance != balances[_token]) { //could be require
            balances[_token] = tokenBalance;
            BalanceChanged(_token, tokenBalance);
        }
    }

    /**
     * @notice Increases the reward for some address
     * @param _destination Reward beneficiary
     * @param _influence Amount to be increased
     */
    function increaseReward(address _destination, uint256 _influence) 
        external
        onlyController
        requiredState(State.OPEN)
    {
        influence[_destination] += _influence;
        influenceTotal += _influence;
        ApprovedReward(_destination, influence[_destination]);
    }

    /**
     * @notice Decreases the reward for some address
     * @param _destination Reward beneficiary
     * @param _influence Amount to be decreased
     */
    function decreaseReward(address _destination, uint256 _influence) 
        external
        onlyController
        requiredState(State.OPEN)
    {
        require(influence[_destination] >= _influence);
        influence[_destination] -= _influence;
        influenceTotal -= _influence;
        ApprovedReward(_destination, influence[_destination]);
    }

    /**
     * @notice Close the issue, state becomes reward if some influence is set, or refund if none.
     */
    function close() 
        external
        onlyController
        requiredState(State.OPEN)
    {
        state = influenceTotal == 0 ? State.REFUND : State.REWARD;
        closedAt = block.timestamp;
        StateChanged(state);
    }

    // Functions that can be called at `state = State.REFUND`

    /**
     * @notice Withdraw reward of multiple _tokens and ether if one of them is `address(0)`
     * @param _from Address that contributed and destination of refunds
     * @param _refundTokens Address of tokens being refunded, `address(0)` to ether.
     */
    function withdrawRefundMultiple(address _from, address[] _refundTokens)
        external
        requiredState(State.REFUND)
    {
        require (_from != address(0));
        uint len = _refundTokens.length;
        for (uint256 i = 0; i < len; i++) {
            refund(_from, _refundTokens[i]);
        }
    }

    /**
     * @notice Withdraw refund of some _token or ether if `_token` is `address(0)`
     * @param _from Address that contributed and destination of refunds
     * @param _refundToken Address of token being refunded, `address(0)` to ether.
     */
    function withdrawRefund(address _from, address _refundToken)
        external
        requiredState(State.REFUND)
    {
        require(_from != address(0));
        refund(_from, _refundToken);
    }

    // Functions that can be called at `state = State.REWARD`

    /**
     * @notice Withdraw reward of multiple _tokens and ether if one of them is `address(0)`
     * @param _destination Address of beneficiary
     * @param _rewardTokens Address of tokens being rewarded, `address(0)` to ether.
     */
    function withdrawRewardMultiple(address _destination, address[] _rewardTokens)
        external
        requiredState(State.REWARD)
    {
        require (_destination != address(0));
        uint len = _rewardTokens.length;
        for (uint256 i = 0; i < len; i++) {
            reward(_destination, _rewardTokens[i]);
        }
    }

    /**
     * @notice Withdraw reward of one _token or ether if `_rewardToken` is `address(0)`
     * @param _destination Address of beneficiary
     * @param _rewardToken Address of token being rewarded, `address(0)` to ether.
     */
    function withdrawReward(address _destination, address _rewardToken)
        external
        requiredState(State.REWARD)
    {
        require (_destination != address(0));
        reward(_destination, _rewardToken);
    }

    // Web3 helpers

    /**
     * @notice calcule `_rewardToken` reward of `_destination`
     * @param _destination Address of beneficiary
     * @param _rewardToken what token being calculated
     */
    function calculeReward(address _destination, address _rewardToken)
        public
        constant
        returns (uint256 total)
    {
        total = (balances[_rewardToken] * influence[_destination]) / influenceTotal;
    }

    // Functions for reclaiming locked funds

    /**
     * @notice Finalizes the bounty enabling it's draining
     */
    function finalize()
        external
        onlyController
        timedOut
    {
        state = State.FINALIZED;
        StateChanged(State.FINALIZED);
    }

    /**
     * @notice Drain some tokens or ether if one of them is `address(0)`
     */
    function drainBounty(address _destination, address[] _drainTokens)
        external
        onlyController
        requiredState(State.FINALIZED)
    {
        uint len = _drainTokens.length;
        for (uint256 i = 0; i < len; i++) {
            address _drainToken = _drainTokens[i];
            uint toPay;
            if (_drainToken == address(0x0)) {
                toPay = this.balance;
                _destination.transfer(toPay);
            } else {
                toPay = Token(_drainToken).balanceOf(address(this));
                require(Token(_drainToken).transfer(_destination, toPay));
            }
        }
    }    

    /////
    // Internal functions

    /**
     * @notice Withdraw reward of some token or ether if `_payoutToken` is `address(0)`
     */
    function reward(address _destination, address _payoutToken)
        internal
    {
        bytes32 rewardHash = keccak256(_destination, _payoutToken);
        require(!rewarded[rewardHash]);
        rewarded[rewardHash] = true; //flag as rewarded
        uint256 toPay = calculeReward(_destination, _payoutToken);
        if (_payoutToken == address(0x0)) {
            _destination.transfer(toPay);
        } else {
            require(Token(_payoutToken).transfer(_destination, toPay));
        }
    }

    /**
     * @notice Withdraw refund of some token or ether if `_refundToken` is `address(0)`
     */
    function refund(address _from, address _refundToken)
        internal
    {
        bytes32 contributionHash = keccak256(_from, _refundToken);
        uint amount = contribution[contributionHash];
        delete contribution[contributionHash]; //removes from storage
        if (_refundToken == address(0)) { 
            _from.transfer(amount);
        } else {
            require(Token(_refundToken).transfer(_from, amount));
        }
    }

}