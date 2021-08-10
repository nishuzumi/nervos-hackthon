pragma solidity >=0.8.0;

contract FomoGame {
  address owner;
  constructor() payable {
    owner = msg.sender;
  }

  event NewWinner(address winner,uint256 pay);
  function play() public payable returns(bool){
    if(getRandomSeed(msg.sender) % 100 < 20){
      emit NewWinner(msg.sender,pool());
      payable(owner).transfer(pool() / 10);
      payable(msg.sender).transfer(pool());
      return true;
    }
    return false;
  }

  function pool() public view returns(uint256) {
    return address(this).balance;
  }

  function getRandomSeed(address user) public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(user, blockhash(block.number - 1))));
  }
}