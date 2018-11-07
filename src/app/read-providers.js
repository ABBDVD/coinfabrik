const moment = require('moment')
const fs = require('fs')
const config = require('./config')
const srcFile = process.argv[2]
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('cdx-network.db')
const account = config.ethAccount()

const web3 = config.web3Provider()
let tokenPool = undefined

function sendRawAddParticipantTx(nonce, participant) {
  let addParticipant = tokenPool.methods.addParticipant(participant)
  const eth = web3.eth
  return Promise.all([eth.getGasPrice(), addParticipant.estimateGas({from: account.address})])
    .then(res => {
      let gasPrice = res[0]
      let gasEstimate = res[1]
      let txObj = {
        nonce: nonce,
        from: account.address,
        to: tokenPool.options.address,
        gas: gasEstimate,
        gasPrice: gasPrice,
        value: 0,
        data: addParticipant.encodeABI()
      }

      return account.signTransaction(txObj)
    })
    .then(signedTx => new Promise((resolve, reject) => {
        eth.sendSignedTransaction(signedTx.rawTransaction)
          .on('transactionHash', (txHash) => {
            resolve(txHash)
          })
          .on('error', err => {
            reject(err)
          })
      })
    )
    .catch(console.log)
}

async function main() {
  tokenPool = await config.contract('TokenPool')

  let providersList = await new Promise((resolve, reject) => {
    fs.readFile(srcFile, (err, content) => {
      resolve(content.toString())
    })
  })

  const providers = providersList.split('\n')
  let nonce = await web3.eth.getTransactionCount(account.address, 'pending')
  for (let i = 1; i < providers.length; i++) {
    const attributes = providers[i].split(';')
    attributes[2] = moment(attributes[2], 'D/M/YY', true).format('YYYY-MM-DD')
    let address = attributes[1]
    let providerAccount;
    if(!address) {
      providerAccount = web3.eth.accounts.create();
      attributes.push(providerAccount.privateKey)
    } else {
      attributes.push('') // ad an empty string as private key
    }
    if(!(await tokenPool.methods.participants(address || providerAccount.address).call())) {
      await sendRawAddParticipantTx(nonce++, address || providerAccount.address)
    }
    db.run('insert into providers(id, address, onboarding, private_key) values(?, ?, ?, ?)', attributes, (err) => {
      if(err && err.errno === 19) {
        db.run('update providers set address = $address, private_key = $private_key where id = $id',
          {$id: attributes[0], $address: address, $private_key: providerAccount ? providerAccount.privateKey : ''})
      } else if(err) {
        console.log(err)
      }
    })
  }
}

main()