const Web3 = require('web3')
const fs = require('fs')

let web3Provider = undefined
let netId = undefined
let account = undefined

exports.web3Provider = () => {
  if(!web3Provider){
    let provider = process.env.WEB3_PROVIDER || 'http://localhost:8585'
    web3Provider = new Web3(new Web3.providers.HttpProvider('http://localhost:8585'))
  }

  return web3Provider
}

exports.ethAccount = () => {
  if(!account) {
    const web3 = exports.web3Provider()
    let privateKey = fs.existsSync('private.key') ? fs.readFileSync('private.key') : undefined
    if (!privateKey) {
      account = web3.eth.accounts.create()
      fs.writeFileSync('private.key', account.privateKey)
      fs.writeFileSync('public.key', account.address)
    } else {
      account = web3.eth.accounts.privateKeyToAccount(privateKey)
    }
  }
  return account
}

exports.contract = async (name) => {
  const json = require('../../build/contracts/' + name + '.json')
  const w3 = exports.web3Provider()
  netId = netId || await w3.eth.net.getId()
  try{
    const address = json.networks[netId] ? json.networks[netId].address : undefined
    return new w3.eth.Contract(json.abi, address)
  } catch (err) {
    return '0x0'
  }
}