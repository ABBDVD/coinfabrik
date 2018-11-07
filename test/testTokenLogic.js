var TokenLogic = artifacts.require("./TokenLogic.sol");
var TokenData = artifacts.require("./TokenData.sol");

contract('TokenLogic', function (accounts) {
    it("has a TokenData contract for which it is the owner", () => {
        let td = undefined;

        return TokenLogic.deployed()
            .then(instance => {
                td = instance;
                return td.data();
            })
            .then(dataAddr => TokenData.at(dataAddr))
            .then(data => data.owner())
            .then(owner => {
                assert.equal(accounts[0], owner, "TokenLogic is the Account's owner");
            })
    })

    it("has a a linked Token contract", () => {
        return TokenLogic.deployed()
            .then(td => td.token())
            .then(token => assert.notEqual(token, "0x0000000000000000000000000000000000000000", "the token address must be defined"));
    })

    it("has a price of 1 Wei for 300 tokens", () => {
        return TokenLogic.deployed()
            .then(tl => tl.tokensPerWei())
            .then(tpw => assert.equal(tpw.toNumber(), 3000, "the price for 1 Wei is 3000 tokens"));
    })

    it("does not set new ico start when called from other than owner", () => {
        return TokenLogic.deployed()
            .then(tl => tl.setIcoStart(12, 120, {from: accounts[2]}))
            .then((tx) => assert.fail())
            .catch(function (error) {
                assert(
                    error.message.indexOf("invalid opcode") >= 0,
                    "throws when setIcoStart is called from another account then the owner"
                )
            });
    })

    it("does set new ico start when called from owner", () => {
        let logic = undefined;
        return TokenLogic.deployed()
            .then(tl => logic = tl)
            .then(() => Promise.all([logic.icoStart(), logic.icoEnd()]))
            .then(res => {
              let icoStart = res[0]
              let icoEnd = res[1]
                /*must have been set to be within the last minute*/
              assert.isAbove(Math.floor(new Date().getTime() / 1000) + 30, icoStart)
              assert.isBelow(Math.floor(new Date().getTime() / 1000) - 30, icoStart)
              assert.equal(icoStart.add(504*3600).toNumber(), icoEnd.toNumber())
            })
            .then(() => logic.setIcoStart(12, 1, {from: accounts[0]}))
            .then(() => Promise.all([logic.icoStart(), logic.icoEnd()]))
            .then(res => {
              assert.equal(res[0].toNumber(), 12)
              assert.equal(res[1].toNumber(), 12 + 3600)
            })
    })
})