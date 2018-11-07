const ipfsAPI = require('ipfs-api')
const sqlite3 = require('sqlite3')

const ipfs = ipfsAPI({
  "host": "ipfs.infura.io",
  "port": "5001",
  "protocol": "https"
})

const db = new sqlite3.Database(filename, [mode], [callback])

