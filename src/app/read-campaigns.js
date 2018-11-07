const moment = require('moment')
const fs = require('fs')
const srcFile = process.argv[2]
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('cdx-network.db')

async function main() {
  db.serialize(async () => {
    let campaignsList = await new Promise((resolve, reject) => {
      fs.readFile(srcFile, (err, content) => {
        resolve(content.toString())
      })
    })

    const campaigns = campaignsList.split('\n')
    for (let i = 1; i < campaigns.length; i++) {
      const attributes = campaigns[i].split(';')
      const start = moment(attributes[1], 'D/M/YYYY', true)
      const end = moment(attributes[2], 'D/M/YYYY', true)
      const campaign = [
        attributes[0],
        start.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD'),
        1
      ]
      db.run('insert into campaigns(id, start, end, cpm) values(?, ?, ?, ?)', campaign, (err) => {
        if(err && err.errno === 19) {
          db.run('update campaigns set start = $start, end = $end, cpm = $cpm where id = $id',
            {$id: campaign[0], $start: campaign[1], $end: campaign[2], $cpm: campaign[3]})
        } else {
          console.log(err)
        }
      })
    }
  })
}

main()