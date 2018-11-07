const config = require('./config')
const sqlite3 = require('sqlite3').verbose()
const BN = require('bn.js')

const web3 = config.web3Provider()
const account = config.ethAccount()
const db = new sqlite3.Database('cdx-network.db')

let tokenPool = undefined

// const date = process.argv[2] //the date is the first parameter passed to the process, the first two are path to node binary and script file

function sendRawTransferTx(nonce, wad, recipient) {
  let transfer = tokenPool.methods.transfer(recipient, new BN(wad.toString(16), 16))
  const eth = web3.eth
  let gasEstimate = new BN("1000000", 10)//await transfer.estimateGas({from: account.address})
  return eth.getGasPrice()
    .then(gasPrice => {
      let txObj = {
        nonce: nonce,
        from: account.address,
        to: tokenPool.options.address,
        gas: gasEstimate,
        gasPrice: gasPrice,
        value: 0,
        data: transfer.encodeABI()
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

function distribute(date) {
  const select = 'select address, private_key,\n' +
    'p.id, \n' +
    'onboarding,\n' +
    'CASE WHEN last_payout THEN date(last_payout, \'-13 days\') ELSE date(onboarding) END as payout_start,\n' +
    'CASE WHEN last_payout THEN date(last_payout, \'+16 days\') ELSE date(onboarding, \'+29 days\') END as payout_end,\n' +
    'CASE WHEN last_payout THEN date(last_payout, \'+29 days\') ELSE date(onboarding, \'+43 days\') END as payout_date,\n' +
    'sum(d.print_count * c.cpm) / 1000 as amount\n' +
    'from providers as p inner join displays as d on p.id = d.provider_id inner join campaigns as c on d.campaign_id = c.id\n' +
    'where date(payout_date) <= date(?) \n' +
    'and date(d.print_date) between date(payout_start) and date(payout_end)\n' +
    'and pending_tx is null\n' +
    'group by p.id\n'

  let nonce = 0
  return web3.eth.getTransactionCount(account.address, 'pending')
    .then(n => {
      nonce = n
      return new Promise((resolve, reject) => {
        db.all(select, date, (err, payouts) => {
          if (err) reject(err)
          else resolve(payouts)
        })
      })
    })
    .then(payouts => {
      const txArray = []
      for (let i = 0; i < payouts.length; i++) {
        txArray.push(() => {
          let address = payouts[i].address || web3.eth.accounts.privateKeyToAccount(payouts[i].private_key).address
          return sendRawTransferTx(nonce++, payouts[i].amount, address)
            .then(txHash => {
              db.run('update providers set pending_tx = $txhash where id = $id',
                {$id: payouts[i].id, $txhash: txHash})
            })
        })
      }
      let result = Promise.resolve()
      txArray.forEach((task) => {
        result = result.then(() => task())
      })
      return result

    })

}

async function initiateDistribution(date) {
  tokenPool = await config.contract('TokenPool')
  const sql = 'select count(*) as nbProviders,\n' +
    '\tCASE WHEN last_payout THEN date(last_payout, \'+29 days\') ELSE date(onboarding, \'+43 days\') END as payout_date\n' +
    'from providers\n' +
    'where date(payout_date) <= date(?)\n' +
    'group by payout_date\n' +
    'order by 1'
  db.each(sql, [date], (err, distributionList) => {
    if (err) return
    distribute(distributionList.payout_date)
  })


  // await new Promise((resolve, reject) => {
  //
  // })
}

initiateDistribution('2017-04-13')