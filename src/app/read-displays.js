const moment = require('moment')
const fs = require('fs')
const srcFile = process.argv[2]
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('cdx-network.db')

async function main() {
  db.serialize(async () => {
    let fileStream = fs.createReadStream(srcFile, {encoding: 'utf8'})
    let displaysList = await new Promise((resolve, reject) => {
      let content = ""
      fileStream.on('data', (data) => {
        content += data.toString()
      })
      fileStream.on('end', () => {
        resolve(content)
      })
    })

    const displays = displaysList.split('\n')
    for (let i = 1; i < displays.length; i++) {
      const attributes = displays[i].split(';')
      const printDate = moment(attributes[1], 'YYYY-MM-DD', true)
      const display = [
        attributes[0],
        printDate.format('YYYY-MM-DD'),
        attributes[2]
      ]
      db.run('insert into displays(provider_id, print_date, print_count) values(?, ?, ?)', display, (err) => {
        if(err && err.errno === 19) {
          db.run('update displays set print_count = $printCount where provider_id = $id and print_date = $printDate',
            {$id: display[0], $printDate: display[1], $printCount: display[2]})
        } else if(err) {
          console.log(err)
        }
      })
    }
  })
}

main()