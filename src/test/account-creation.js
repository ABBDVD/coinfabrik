require('mocha')
let expect = require('chai').expect
let conf = require('../app/config')



describe('web3 account creation', () => {
  const web3 = conf.web3Provider()

  before(() => {
  })

  it('creates an account and saves it to JSON', async () => {
    expect(await web3.eth.net.getId()).to.equal(256)
    let account = web3.eth.accounts.create()
    let address = account.address
    expect(account.address).to.equal(web3.eth.accounts.privateKeyToAccount(account.privateKey).address)
  })
})