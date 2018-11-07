const moment = require('moment')
const fs = require('fs')
const bn = require('bignumber.js')
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('cdx-network.db')

async function main(date) {
  const supply = await new Promise((resolve, reject) => {
    db.get('select sum(daily_contribution) as sum from campaigns where date($date) between date(start) and date(end)',
      {$date: date}, (err, supply) => {
        if(err) reject(err)
        else resolve(supply.sum)
      })
  })
  console.log('supply', supply)

  const totalDisplays = await new Promise((resolve, reject) => {
    db.get('select sum(print_count) sum  from displays where date(print_date) = date($date)',
      {$date: date}, (err, prints) => {
        if(err) reject(err)
        else resolve(prints.sum)
      })
  })
  console.log("diplays", totalDisplays)

  let sum = new bn(0)
  return new Promise((resolve, reject) => {
    db.each('select d.provider_id as id, d.print_count * 1e18 / $totalDisplays * $supply as allocation ' +
      'from displays d ' +
      'where date(d.print_date) = date($date)',
      {$totalDisplays: totalDisplays, $supply: supply, $date: date}, (err, provider) => {
      db.run('insert into payouts(provider_id, print_date, token_allocation) values(?, ?, ?)',
        [provider.id, date, provider.allocation], (err) => {
          if(err) {
            console.log(err)
          }
        })
    }, err => {
        if (err) reject(err)
        else resolve(true)
      })
  })
}

async function runner() {
  let date = moment('01.03.2017', 'DD.MM.YYYY', true)
  for (let i = 0; i < 202; i++) {
    date.add(1, 'days')
    console.log(date.format('YYYY-MM-DD'), "start")
    await main(date.format('YYYY-MM-DD'))
    console.log(date.format('YYYY-MM-DD'), "done")
  }
  db.close()
}

runner()

