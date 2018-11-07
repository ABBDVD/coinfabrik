var Token = artifacts.require("Token");
var TokenLogic = artifacts.require("TokenLogic");
var TokenPool = artifacts.require("TokenPool");
var TokenIceBox = artifacts.require("TokenIceBox");
var Roles = artifacts.require("Roles");
var ContributionRegistration = artifacts.require("ContributionRegistration");

module.exports = function (deployer) {
  deployer.deploy(Token, "Network", "CDX").then(function () {
    console.log("deployment log Token address is", Token.address);
    return Token.address;
  })
    .then(() => {
      return deployer.deploy(Roles)
    })
    .then(function () {
      return deployer.deploy(TokenLogic, Token.address, 0, Math.floor(new Date().getTime() / 1000), 21 * 24)
    })
    .then(function () {
      return TokenLogic.at(TokenLogic.address);
    })
    .then(function (tokenLogic) {
      console.log("deployment log TokenLogic address is", tokenLogic.address);
      return tokenLogic.owner();
    })
    .then(function (owner) {
      console.log("deployment log TokenData owner is", owner)
      return Token.at(Token.address);
    })
    .then(function (token) {
      return token.setLogic(TokenLogic.address);
    })
    .then(() => {
      return deployer.deploy(TokenPool, Token.address, web3.eth.accounts[7], Roles.address)
    })
    .then(() => {
      return deployer.deploy(ContributionRegistration, Roles.address)
    })
    .then(async () => {
      await Token.at(Token.address).transfer(TokenPool.address, 1e22)
      await Token.at(Token.address).transfer(TokenPool.address, 5e25)
    })
};