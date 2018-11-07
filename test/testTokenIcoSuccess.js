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

  it("sets ico start 167 hours in the past", () => {
    return setIcoStart(167);
  })

  it("sells 300 + 50% new token when sent 1 ETH", () => {
    let tokens = 300;
    let premium = 0.5;
    let toMint = tokens * 1e18 * (1 + premium);
    minted += toMint;
    ethBalance++;
    return logic.setTokensPerWei(tokens)
      .then(() => web3.eth.sendTransaction({
        from: accounts[1],
        to: token.address,
        value: web3.toWei(1, "ether"),
        gas: 200000
      }))
      .then(() => Promise.all([token.balanceOf(accounts[1]), token.balanceOf(accounts[0]), web3.eth.getBalance(token.address)]))
      .then(res => {
        assert.equal(res[0].toNumber(), minted, (toMint / 1e18) + " tokens per ETH balance");
        assert.equal(res[1].div(1e18).toNumber(), 120e6 - minted / 1e18, "120 mio - " + minted / 1e18 + " tokens for owner balance");
        assert.equal(res[2].toNumber(), ethBalance * 1e18, ethBalance + " ETH balance in the contract");
      })
  });

  it("sets ico start 311 hours in the past", () => {
    return setIcoStart(311);
  })

  it("sells 250 + 30% new token when sent 1 ETH", () => {
    let tokens = 250;
    let premium = 0.3;
    let toMint = tokens * 1e18 * (1 + premium);
    minted += toMint;
    ethBalance++;
    return logic.setTokensPerWei(tokens)
      .then(() => web3.eth.sendTransaction({
        from: accounts[1],
        to: token.address,
        value: web3.toWei(1, "ether"),
        gas: 200000
      }))
      .then(() => Promise.all([token.balanceOf(accounts[1]), token.balanceOf(accounts[0]), web3.eth.getBalance(token.address)]))
      .then(res => {
        assert.equal(res[0].toNumber(), minted, (toMint / 1e18) + " tokens per ETH balance");
        assert.equal(res[1].div(1e18).toNumber(), 120e6 - minted / 1e18, "120 mio - " + minted / 1e18 + " tokens for owner balance");
        assert.equal(res[2].toNumber(), ethBalance * 1e18, ethBalance + " ETH balance in the contract");
      })
  });

  it("sets ico start 455 hours in the past", () => {
    return setIcoStart(455);
  })

  it("sells 300 + 10% new token when sent 1 ETH", () => {
    let tokens = 400;
    let premium = 0.1;
    let toMint = tokens * 1e18 * (1 + premium);
    minted += toMint;
    ethBalance++;
    return logic.setTokensPerWei(tokens)
      .then(() => web3.eth.sendTransaction({
        from: accounts[1],
        to: token.address,
        value: web3.toWei(1, "ether"),
        gas: 200000
      }))
      .then(() => Promise.all([token.balanceOf(accounts[1]), token.balanceOf(accounts[0]), web3.eth.getBalance(token.address)]))
      .then(res => {
        assert.equal(res[0].toNumber(), minted, (toMint / 1e18) + " tokens per ETH balance");
        assert.equal(res[1].div(1e18).toNumber(), 120e6 - minted / 1e18, "120 mio - " + minted / 1e18 + " tokens for owner balance");
        assert.equal(res[2].toNumber(), ethBalance * 1e18, ethBalance + " ETH balance in the contract");
      })
  });

  it("sets ico start 457 hours in the past", () => {
    return setIcoStart(457);
  })

  it("sells 89998965 + 0% new token when sent 300K ETH", () => {
    let tokens = 300;
    let toMint = new BigNumber(90000000).mul(1e18).sub(minted).toNumber();
    let priceOfCoins = new BigNumber(toMint.toString()).div(tokens);
    let mint = new BigNumber(90000000).mul(1e18);
    let initialBuyerBalance = 0;
    return logic.setTokensPerWei(tokens)
      .then(() => web3.eth.getBalance(accounts[7]))
      .then(balance => initialBuyerBalance = balance)
      .then(() => web3.eth.sendTransaction({
        from: accounts[7],
        to: token.address,
        value: web3.toWei(300000, "ether"),
        gas: 200000
      }))
      .then(() => Promise.all([token.balanceOf(accounts[7]), token.balanceOf(accounts[0]), web3.eth.getBalance(token.address), web3.eth.getBalance(accounts[7])]))
      .then(res => {
        assert.equal(res[0].div(1e18).toNumber(), Math.floor(toMint / 1e18), Math.floor(toMint / 1e18) + " tokens per ETH balance");
        assert.equal(res[1].div(1e18).toNumber(), new BigNumber(120e24).sub(mint).div(1e18).toNumber(), "120 mio - " + new BigNumber(mint).div(1e18).toNumber() + " tokens for owner balance");
        assert.equal(res[2].div(1e18).toNumber(), priceOfCoins.add(3e18).div(1e18).toNumber(), priceOfCoins.add(3e18).div(1e18).toNumber() + " ETH balance in the contract");
        assert.equal(res[3].div(1e18).toNumber(), priceOfCoins.sub(initialBuyerBalance).div(-1e18).toNumber(), priceOfCoins.sub(initialBuyerBalance).div(-1e18).toNumber() + " ETH balance for the buyer");
      })
  });

  it("does not sell new token when sent 1 ETH after max has been reached", () => {
    let balance = web3.eth.getBalance(accounts[1]);
    return TokenLogic.deployed()
      .then(() => web3.eth.sendTransaction({
        from: accounts[1],
        to: token.address,
        value: web3.toWei(1, "ether"),
        gas: 200000
      }))
      .then(() => assert.fail())
      .catch(function (error) {
        let newBalance = web3.eth.getBalance(accounts[1])
        assert(newBalance.add(200000).equals(balance), "the balance should not have changed by more than the gas " + newBalance.sub(balance).toString())
        assert(
          error.message.indexOf("invalid opcode") >= 0,
          "throws when ETH is sent after ICO closed"
        )
      });
  });

  it("sets ico start 160 hours in the past", () => {
    return setIcoStart(160);
  })

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
