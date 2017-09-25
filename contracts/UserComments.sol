pragma solidity ^0.4.11;


/// @title User Comments
/// @author Mark Beylin <mark.beylin@consensys.net>

contract UserComments{
    event CommentAdded(string _comment, address _from, address _to, uint _time);

    struct Comment{
      string comment;
      address from;
      address to;
      uint time;
    }


    mapping (address => mapping (address => Comment)) public commentsMap;
    mapping (address => Comment[]) public commentsAboutUser;
    mapping (address => Comment[]) public commentsByUser;

    modifier isValidAboutIndex(address _about, uint i){
      require (i < commentsAboutUser[_about].length);
      _;
    }
    modifier isValidByIndex(address _by, uint i){
      require (i < commentsByUser[_by].length);
      _;
    }

    function addComment(string _comment, address _to)
    public {
      commentsMap[msg.sender][_to] = Comment(_comment, msg.sender, _to, block.timestamp);
      commentsAboutUser[_to].push(commentsMap[msg.sender][_to]);
      commentsByUser[msg.sender].push(commentsMap[msg.sender][_to]);
      CommentAdded(_comment, msg.sender, _to, block.timestamp);
    }

    function numCommentsAboutUser(address _user)
    public
    constant
    returns (uint){
      return commentsAboutUser[_user].length;
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
    returns (string, address, address, uint){
      return (commentsAboutUser[_about][_commentId].comment,
              commentsAboutUser[_about][_commentId].from,
              commentsAboutUser[_about][_commentId].to,
              commentsAboutUser[_about][_commentId].time);
    }

    function getCommentByAddress(address _by, uint _commentId)
    isValidByIndex(_by, _commentId)
    public
    constant
    returns (string, address, address, uint){
      return (commentsByUser[_by][_commentId].comment,
              commentsByUser[_by][_commentId].from,
              commentsByUser[_by][_commentId].to,
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
}
