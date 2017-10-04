pragma solidity ^0.4.11;


/// @title User Comments
/// @author Mark Beylin <mark.beylin@consensys.net>

contract UserComments {
    event CommentAdded(string _comment, address _from, address _to, uint _time);

    struct Comment{
      string comment;
      address from;
      address to;
      bool aboutBounty;
      uint bountyId;
      uint time;
    }


    mapping (address => mapping (address => Comment)) public commentsMap;
    mapping (address => Comment[]) public commentsAboutUser;
    mapping (address => Comment[]) public commentsByUser;
    mapping (uint => Comment[]) public commentsAboutBounty;

    modifier isValidAboutIndex(address _about, uint i){
      require (i < commentsAboutUser[_about].length);
      _;
    }
    modifier isValidByIndex(address _by, uint i){
      require (i < commentsByUser[_by].length);
      _;
    }

    function addComment(string _comment, address _to, bool _aboutBounty, uint _bountyId)
    public
    {
      commentsByUser[msg.sender].push(Comment(_comment, msg.sender, _to, _aboutBounty, _bountyId, block.timestamp));
      if (_aboutBounty){
        commentsAboutBounty[_bountyId].push(commentsByUser[msg.sender][commentsByUser[msg.sender].length - 1]);
      } else {
        commentsAboutUser[_to].push(commentsByUser[msg.sender][commentsByUser[msg.sender].length - 1]);
        commentsMap[msg.sender][_to] = commentsByUser[msg.sender][commentsByUser[msg.sender].length - 1];
      }
      CommentAdded(_comment, msg.sender, _to, block.timestamp);
    }

    function numCommentsAboutUser(address _user)
    public
    constant
    returns (uint){
      return commentsAboutUser[_user].length;
    }

    function numCommentsAboutBounty(uint _bountyId)
    public
    constant
    returns (uint){
      return commentsAboutBounty[_bountyId].length;
    }

    function numCommentsByUser(address _user)
    public
    constant
    returns (uint){
      return commentsByUser[_user].length;
    }

    function getCommentAboutAddress(address _about, uint _commentId)
    isValidAboutIndex(_about, _commentId)
    public
    constant
    returns (string, address, uint){
      return (commentsAboutUser[_about][_commentId].comment,
              commentsAboutUser[_about][_commentId].from,
              commentsAboutUser[_about][_commentId].time);
    }

    function getCommentByAddress(address _by, uint _commentId)
    isValidByIndex(_by, _commentId)
    public
    constant
    returns (string, address, bool, uint, uint){
      return (commentsByUser[_by][_commentId].comment,
              commentsByUser[_by][_commentId].to,
              commentsByUser[_by][_commentId].aboutBounty,
              commentsByUser[_by][_commentId].bountyId,
              commentsByUser[_by][_commentId].time);
    }

    function getCommentFromTo(address _from, address _to)
    public
    constant
    returns (string, address, address, uint){
      return (commentsMap[_from][_to].comment,
              commentsMap[_from][_to].from,
              commentsMap[_from][_to].to,
              commentsMap[_from][_to].time);
    }
    function getCommentAboutBounty(uint _bountyId, uint _commentId)
    public
    constant
    returns (string, address, uint){
      return (commentsAboutBounty[_bountyId][_commentId].comment,
              commentsAboutBounty[_bountyId][_commentId].from,
              commentsAboutBounty[_bountyId][_commentId].time);
    }
}
