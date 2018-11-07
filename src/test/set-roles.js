var TokenPool = artifacts.require("TokenPool")
var Roles = artifacts.require("Roles")
var Token = artifacts.require("ERC20")

module.exports = async function(callback) {
  let tp = TokenPool.at(TokenPool.address)
  let roles = Roles.at(Roles.address)
  let hash = await tp.contractHash()
  const roleName = 'oracle'
  const oracleAddress = '0x019917CCf6D6Bf33B5BF76e9aBf2E8F3E52bD9e8'
  let hasRole = await tp.hasRole(roleName)

  if(!hasRole){
    console.log('adding role oracle')
    await roles.addContractRole(hash, roleName)
  }

  console.log('granting role oracle to', oracleAddress)
  await roles.grantUserRole(hash, roleName, oracleAddress)
  await roles.grantUserRole(hash, roleName, web3.eth.accounts[1])

  let token = Token.at(await tp.token())
  console.log("TokenPool balance", (await token.balanceOf(tp.address)).toString())
  console.log("owner balance", (await token.balanceOf(web3.eth.accounts[0])).toString())
  console.log("Token totalSupply", (await token.totalSupply()).toString())

  callback()
}