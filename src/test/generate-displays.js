const moment = require('moment')
const fs = require('fs')
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('cdx-network.db')

async function main() {
  let date = moment('01.03.2017', 'DD.MM.YYYY', true)
  for (let i = 0; i < 202; i++) {
    date.add(1, 'days')
    let providers = await new Promise((resolve, reject) => {
      db.all('select * from providers where date(onboarding) <= date(?)', date.format('YYYY-MM-DD'), (err, providers) => {
        resolve(providers)
      })
    })
    let campaigns = await new Promise((resolve, reject) => {
      db.all('select * from campaigns where date(start) <= date($date) and date(end) >= date($date) ',
        {$date: date.format('YYYY-MM-DD')}, (err, campaigns) => {
          resolve(campaigns)
        })
    })
    console.log(date.format('YYYY-MM-DD'), providers.length)
    providers.forEach(provider => {
      campaigns.forEach(campaign => {
        db.run('insert into displays(provider_id, campaign_id, print_date, print_count) values(?, ?, ?, ?)',
          [provider.id, campaign.id, date.format('YYYY-MM-DD'), Math.floor(Math.random() * 45 + 5)])
      })
    })
  }
}

main()