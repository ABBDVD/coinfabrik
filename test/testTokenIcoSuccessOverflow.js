var BigNumber = require("bignumber.js");
var TokenLogic = artifacts.require("./TokenLogic.sol");
var Token = artifacts.require("./Token.sol");

contract('TokenICO - Success', function (accounts) {
  let logic = undefined;
  let token = undefined;

  before(() => {
    return TokenLogic.deployed()
      .then(tl => logic = tl)
      .then(() => Token.deployed())
      .then(t => token = t)
  })

  let setIcoStart = (hours) => {
    let icoStart = Math.floor(new Date().getTime() / 1000) - 3600 * hours;
    return logic.setIcoStart(icoStart, 504, {from: accounts[0]})
      .then(() => logic.icoStart())
      .then(newStart => assert.equal(newStart.toNumber(), icoStart))
  }

  let minted = 0;
  let ethBalance = 0;

  it("removes the presale flag", () => {
    return logic.presale()
      .then(ps => {
        assert.ok(ps)
        return logic.setPresale(false)
      })
      .then(() => logic.presale())
      .then(ps => assert.ok(!ps))

  })

  it("sets ico start 500 hours in the past", () => {
    return setIcoStart(500);
  })

  it("sells 45 mio new token when sent 5'000 ETH", () => {
    let tokens = 9000;
    let toMint = tokens * 5e21
    minted += toMint;
    ethBalance += 5000;
    return logic.setTokensPerWei(tokens)
      .then(() => web3.eth.sendTransaction({
        from: accounts[1],
        to: token.address,
        value: web3.toWei(5000, "ether"),
        gas: 200000
      }))
      .then(() => Promise.all([token.balanceOf(accounts[1]), token.balanceOf(accounts[0]), web3.eth.getBalance(token.address)]))
      .then(res => {
        assert.equal(res[0].toNumber(), minted, (toMint / 1e18) + " tokens per ETH balance");
        assert.equal(res[1].div(1e18).toNumber(), 120e6 - minted / 1e18, "120 mio - " + minted / 1e18 + " tokens for owner balance");
        assert.equal(res[2].toNumber(), ethBalance * 1e18, ethBalance + " ETH balance in the contract");
      })
  });

  // the goal is to test the overflow calculation and ensure that the ETH balance is not higher than it should be
  it("sells 45 mio new token when sent 6'000 ETH", () => {
    let tokens = 9000;
    let toMint = tokens * 5e21
    minted += toMint;
    ethBalance += 5000;
    return logic.setTokensPerWei(tokens)
      .then(() => web3.eth.sendTransaction({
        from: accounts[1],
        to: token.address,
        value: web3.toWei(6000, "ether"),
        gas: 200000
      }))
      .then(() => Promise.all([token.balanceOf(accounts[1]), token.balanceOf(accounts[0]), web3.eth.getBalance(token.address)]))
      .then(res => {
        assert.equal(res[0].toNumber(), minted, (toMint / 1e18) + " tokens per ETH balance");
        assert.equal(res[1].div(1e18).toNumber(), 120e6 - minted / 1e18, "120 mio - " + minted / 1e18 + " tokens for owner balance");
        assert.equal(res[2].toNumber(), ethBalance * 1e18, ethBalance + " ETH balance in the contract");
      })
  });

  it("does not sell new token when sent 1 ETH", () => {
    return TokenLogic.deployed()
      .then(() => web3.eth.sendTransaction({
        from: accounts[1],
        to: token.address,
        value: web3.toWei(1, "ether"),
        gas: 200000
      }))
      .then(() => assert.fail())
      .catch(function (error) {
        assert(
          error.message.indexOf("invalid opcode") >= 0,
          "throws when ETH is sent after ICO closed"
        )
      });
  });


})
