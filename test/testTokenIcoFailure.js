var BigNumber = require("bignumber.js");
var TokenLogic = artifacts.require("./TokenLogic.sol");
var Token = artifacts.require("./Token.sol");

contract('TokenICO - Failure', function (accounts) {

    let minted = 0;
    let ethBalance = 0;

    it("sets ico start 10 hours in the past", () => {
        let logic = undefined;
        //ICO is 60 hours old and in resale
        let icoStart = Math.floor(new Date().getTime() / 1000) - 3600 * 10;
        return TokenLogic.deployed()
            .then(tl => logic = tl)
            .then(() => logic.setIcoStart(icoStart, 120, {from: accounts[0]}))
            .then(() => logic.icoStart())
            .then(newStart => assert.equal(newStart, icoStart))
    })

    it("sells 9'000'000 new tokens", () => {
        let token = undefined;

        return Token.deployed()
            .then(t => token = t)
            /*send 10'000 ETH for 3mio tokens from each account*/
            .then(() => web3.eth.sendTransaction({from: accounts[3], to: token.address, value: web3.toWei(1000, "ether"), gas: 200000}))
            .then(() => web3.eth.sendTransaction({from: accounts[4], to: token.address, value: web3.toWei(1000, "ether"), gas: 200000}))
            .then(() => web3.eth.sendTransaction({from: accounts[5], to: token.address, value: web3.toWei(1000, "ether"), gas: 200000}))

            /*check balances*/
            .then(() => token.balanceOf(accounts[3]))
            .then(balance => assert.equal(balance.toNumber(10), 3e24, "the account bought 3mio tokens"))
            .then(() => token.balanceOf(accounts[4]))
            .then(balance => assert.equal(balance.toNumber(10), 3e24, "the account bought 3mio tokens"))
            .then(() => token.balanceOf(accounts[5]))
            .then(balance => assert.equal(balance.toNumber(10), 3e24, "the account bought 3mio tokens"))
    });

    it("does not return investments before ICO closes", () => {
        return TokenLogic.deployed()
            .then(logic => logic.returnIcoInvestments(0))
            .then(() => assert.fail())
            .catch(function (error) {
                assert(
                    error.message.indexOf("invalid opcode") >= 0,
                    "throws when ETH is sent after ICO closed"
                )
            });
    });

    it("returns investments after ICO closes", () => {
        let token = undefined;
        let logic = undefined;
        let initialBuyerBalance = [];
        let icoStart = Math.floor(new Date().getTime() / 1000) - 3600 * 121;
        return Token.deployed()
            .then(t => token = t)
            /*remember the initial balances of accounts 3, 4 and 5*/
            .then(() => web3.eth.getBalance(accounts[3]))
            .then(balance => initialBuyerBalance[0] = balance)
            .then(() => web3.eth.getBalance(accounts[4]))
            .then(balance => initialBuyerBalance[1] = balance)
            .then(() => web3.eth.getBalance(accounts[5]))
            .then(balance => initialBuyerBalance[2] = balance)

            /*close the ICO by setting the icoStart further into the past*/
            .then(() => TokenLogic.deployed())
            .then(tl => logic = tl)
            .then(() => logic.setIcoStart(icoStart, 120, {from: accounts[0]}))

            /*return ICO investments 5000000000000000*/
            .then(() => logic.returnIcoInvestments(0), {from: accounts[0], gas: 2000000})
            .then(() => logic.returnIcoInvestments(1), {from: accounts[0], gas: 2000000})
            .then(() => logic.returnIcoInvestments(2), {from: accounts[0], gas: 2000000})

            /*verifiy the balances after returning the ETH*/
            .then(() => web3.eth.getBalance(accounts[3]))
            //get back the 1'000 ETH minus the 5 finney fee (0.005 ETH)
            .then(balance => assert.equal(initialBuyerBalance[0].toNumber(), balance.sub(1e21).add(5e15).toNumber(), balance.sub(initialBuyerBalance[0]).div(1e18).toNumber() + " the new balance is the initial minus the fee"))
            .then(() => web3.eth.getBalance(accounts[4]))
            .then(balance => assert.equal(initialBuyerBalance[1].toNumber(), balance.sub(1e21).add(5e15).toNumber(), "the new balance is the initial minus the fee"))
            .then(() => web3.eth.getBalance(accounts[5]))
            .then(balance => assert.equal(initialBuyerBalance[2].toNumber(), balance.sub(1e21).add(5e15).toNumber(), "the new balance is the initial minus the fee"))

    })

})
