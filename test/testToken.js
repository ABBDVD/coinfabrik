var TokenLogic = artifacts.require("./TokenLogic.sol");
var Token = artifacts.require("./Token.sol");

contract('Token', function (accounts) {
    it("has a reference to TokenLogic", () => {
        return TokenLogic.deployed()
            .then(tb => Promise.all([tb.address, Token.deployed()]))
            .then(res => Promise.all([res[0], res[1].logic(), res[1].owner()]))
            .then(res => {
                assert.equal(res[0], res[1], "The token base is referenced");
                assert.equal(res[2], accounts[0], "accounts[0] is the owner");
            });
    });

    it("has a reference in TokenLogic", () => {
        return Token.deployed()
            .then(t => Promise.all([t.address, TokenLogic.deployed()]))
            .then(res => Promise.all([res[0], res[1].token()]))
            .then(res => assert.equal(res[0], res[1], "The token is referenced in token base"));
    });

    it("has ICO start within last minute", () => {
        return TokenLogic.deployed()
            .then(logic => logic.icoStart())
            .then(icoStart => {
                /*must have been set to be within the last minute - 100 hours*/
                assert.isAbove(Math.floor(new Date().getTime() / 1000) + 30, icoStart)
                assert.isBelow(Math.floor(new Date().getTime() / 1000) - 30, icoStart)
            })
    })

    it("is called Network which can be changed to Netwrork1", () => {
      let token = undefined
      return Token.deployed()
        .then(t => {
          token = t
          return token.name()
        })
        .then(name => {
          assert.equal(name, "Network")
          return token.setName("Network1")
        })
        .then(() => token.name())
        .then(name => assert.equal(name, "Network1"))

    })

    it("is has CDX as its symbol which can be changed to CDK", () => {
      let token = undefined
      return Token.deployed()
        .then(t => {
          token = t
          return token.symbol()
        })
        .then(sym => {
          let symbol = web3._extend.utils.toAscii(sym).substring(0, 3)
          assert.equal(symbol, "CDX")
          return token.setSymbol("CDK")
        })
        .then(() => token.symbol())
        .then(sym => assert.equal(web3._extend.utils.toAscii(sym).substring(0, 3), "CDK"))

    })

    it("has accounts[0] as owner", () => {
        return Token.deployed()
            .then(t => t.owner())
            .then(owner => assert.equal(owner, accounts[0], "accounts[0] is the owner"))
    })

    it("has been created with a supply of 120'000'000", () => {
        return Token.deployed()
            .then(t => t.totalSupply())
            .then(supply => assert.equal(supply.toNumber(), 120e24, "120 mio tokens in initial state"));
    });

    it("has an owner with a balance of 120'000'000", () => {
        return Token.deployed()
            .then(t => t.balanceOf(accounts[0]))
            .then(balance => assert.equal(balance.toNumber(), 120e24, "120 mio tokens in initial state"));
    });

    it("mints 1000 new token when sent 1 ETH", () => {
        let token = undefined;
        return Token.deployed()
            .then(t => token = t)
            .then(() => web3.eth.sendTransaction({from: accounts[1], to: token.address, value: web3.toWei(1, "ether"), gas: 200000}))
            .then(() => Promise.all([token.balanceOf(accounts[1]), token.totalSupply(), web3.eth.getBalance(token.address)]))
            .then(res => {
                assert.equal(res[0].toNumber(), 3e21, "3000 tokens per ETH balance");
                assert.equal(res[2].toNumber(), 1e18, "1 ETH balance in the contract");
            })
    });

    it("throws when payout is called from another account than the owner", () => {
        return Token.deployed()
            .then(token => token.payout(accounts[1], {from: accounts[2]}))
            .then(() => assert.fail())
            .catch(function (error) {
                assert(
                    error.message.indexOf("invalid opcode") >= 0,
                    "throws when payout is called from another account then the owner"
                )
            });
    })

    it("pays 1 ETH to the designated account", () => {
        let token = undefined;
        let balance = 0;
        return Token.deployed()
            .then(t => token = t)
            .then(() => web3.eth.getBalance(accounts[1]))
            .then(bal => balance = bal)
            .then(() => token.payout(accounts[1]))
            .then(() => Promise.all([web3.eth.getBalance(accounts[1]), web3.eth.getBalance(token.address)]))
            .then(res => {
                assert.equal(res[0].minus(balance).toNumber(), 1e18, "1 ETH additional balance for accounts[1]");
                assert.equal(res[1].toNumber(), 0, "0 ETH balance in the contract");

            });
    });

    it("transfers tokens", () => {
        let token = undefined;
        return Token.deployed()
            .then(t => token = t)
            .then(() => token.transfer(accounts[2], 1e21, {from: accounts[1]}))
            .then(() => Promise.all([token.balanceOf(accounts[1]), token.balanceOf(accounts[2])]))
            .then(res => {
                assert.equal(res[0].toNumber(), 2e21, "1e20 tokens were transfered 2e20 remaining")
                assert.equal(res[1].toNumber(), 1e21, "1e20 tokens were transfered")
            })
    })

    it("does not transfer ownership if called from the wrong account", () => {
        return Token.deployed()
            .then(token => token.setOwner(accounts[1], {from: accounts[2]}))
            .then(() => assert.fail())
            .catch(function (error) {
                assert(
                    error.message.indexOf("invalid opcode") >= 0,
                    "throws when setOwner is called from another account then the owner"
                )
            });
    })

    it("transfers the owner and all their tokens", () => {
        let token = undefined;
        let balance = 0;
        return Token.deployed()
            .then(t => token = t)
            .then(() => token.balanceOf(accounts[0]))
            .then( bal => balance = bal)
            .then(() => token.setOwner(accounts[9], {from: accounts[0]}))
            .then(() => token.owner())
            .then( owner => assert.equal(owner, accounts[9]))
            .then(() => token.balanceOf(accounts[9]))
            .then( bal => assert.equal(bal.toNumber(), balance.toNumber()))
    })

})
