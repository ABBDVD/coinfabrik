let Roles = artifacts.require("Roles");
let Token = artifacts.require("Token");
let TokenPool = artifacts.require("TokenPool");
let TokenIceBox = artifacts.require("TokenIceBox");

contract('TokenPool', function (accounts) {
  let roles = Roles.at(Roles.address)
  let tknPool = undefined;
  let tknIceBox = undefined;
  let tkn = undefined

  it("has a Token contract reference", () => {

    return TokenPool.deployed()
      .then(instance => {
        tknPool = instance;
        return tknPool.token();
      })
      .then(tknAddr => {
        assert.equal(tknAddr, Token.address, "Token is the referenced in the pool")
        return tknPool.iceBox()
      })
      .then(tknIB => tknIceBox = TokenIceBox.at(tknIB))
  })

  it("transfers 1'000 tokens to the TokenPool", () => {
    return Token.deployed()
      .then(inst => {
        tkn = inst
        return web3.eth.sendTransaction({
          from: accounts[1],
          to: tkn.address,
          value: web3.toWei(1000000, "ether"),
          gas: 200000
        })
      })
      .then(() => tkn.transfer(tknPool.address, 2e21, {from: accounts[1]}))
      .then(() => tkn.transfer(tknIceBox.address, 5e25, {from: accounts[1]}))
      .then(() => tkn.balanceOf(tknPool.address))
      .then(bal => assert.equal(bal.toNumber(), 2e21, "2'000 tokens were trnsfered"))
      .then(() => tkn.balanceOf(tknIceBox.address))
      .then(bal => assert.equal(bal.toNumber(), 5e25, "50 mio tokens were trnsfered"))
  })

  it("fails to transfer to a non participant", () => {
    return tknPool.transfer(accounts[2], 1e21)
      .then(() => assert.fail())
      .catch(function (error) {
        assert(
          error.message.indexOf("invalid opcode") >= 0,
          "this should have failed"
        )
      })
  })

  it("fails to add a participant if not called by the oracle", () => {
    return tknPool.addParticipant(accounts[2], {from: accounts[3]})
      .then(() => assert.fail())
      .catch(function (error) {
        assert(
          error.message.indexOf("invalid opcode") >= 0,
          "this should have failed"
        )
      })
  })

  it("can add and transfer to a participant from owner", () => {
    return tknPool.addParticipant(accounts[2])
      .then(() => tknPool.transfer(accounts[2], 1e21))
      .then(() => tkn.balanceOf(accounts[2]))
      .then(bal => assert.equal(bal.toNumber(), 1e21, "1'000 tokens were trnsfered"))
  })

  it("can remove and not transfer to a participant anymore", () => {
    return tknPool.removeParticipant(accounts[2])
      .then(() => tknPool.transfer(accounts[2], 1e21))
      .then(() => assert.fail())
      .catch(function (error) {
        assert.ok(
          error.message.indexOf("invalid opcode") >= 0,
          "this should have failed"
        )
      })
  })

  it("can add and transfer to a participant from new oracle", async () => {
    let ctrct = await tknPool.contractHash()
    roles.addContractRole(ctrct, "oracle")
    roles.grantUserRole(ctrct, "oracle", accounts[3])
    await tknPool.addParticipant(accounts[2], {from: accounts[3]})
    await tknPool.transfer(accounts[2], 1e21, {from: accounts[3]})
    let bal = await tkn.balanceOf(accounts[2])
    assert.equal(bal.toNumber(), 2e21, "1'000 tokens were trnsfered")
  })

  it('has transfered 50K Tokens for each participant', () => {
    return tkn.balanceOf(accounts[7])
      .then(bal => assert.equal(bal.toNumber(), 1e23, "100K tokens were trnsfered"))
  })

})