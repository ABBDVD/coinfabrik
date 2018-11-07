const ContributionRegistration = artifacts.require("ContributionRegistration");
const ipfsAPI = require('ipfs-api')

contract('ContributionRegistration', function (accounts) {
  let cr = undefined
  const ipfs = ipfsAPI({
    "host": "ipfs.infura.io",
    "port": "5001",
    "protocol": "https"
  });

  before(async () => {
    cr = ContributionRegistration.at(ContributionRegistration.address)
  })

  it('has no list for 01-01-2017', async () => {
    assert.notOk(await cr.hasHash(web3.fromAscii('01-01-2017'), 0))
  })

  it('returns an IPFS hash for a given date', async () => {
    const res = await ipfs.util.addFromStream(new Buffer('some string', 'utf8'))
    await cr.addContributionList(web3.fromAscii('01-01-2017'), res[0].path)
    assert.ok(await cr.hasHash(web3.fromAscii('01-01-2017'), 0))
    assert.equal(res[0].path, await cr.getLastHash(web3.fromAscii('01-01-2017')))
  })

  it('adds a second IPFS hash for a given date', async () => {
    const res = await ipfs.util.addFromStream(new Buffer('some other string', 'utf8'))
    await cr.addContributionList(web3.fromAscii('01-01-2017'), res[0].path)
    assert.ok(await cr.hasHash(web3.fromAscii('01-01-2017'), 1))
    assert.equal(res[0].path, await cr.getHash(web3.fromAscii('01-01-2017'), 1))
  })

})