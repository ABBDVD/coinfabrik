var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('cdx-network.db')

db.serialize(() =>
{
  db.run('drop table if exists campaigns')
  db.run('drop table if exists providers')
  db.run('drop table if exists displays')
  db.run('drop table if exists payouts')
  db.run('create table campaigns(id TEXT, start TEXT, end TEXT, cpm REAL)', console.log)
  db.run('create UNIQUE INDEX campaign_id on campaigns(id)', console.log)
  db.run('create table providers(id TEXT, address TEXT, onboarding TEXT, privateKey TEXT, last_payout TEXT, pending_tx TEXT)', console.log)
  db.run('create UNIQUE INDEX provider_id on providers(id)', console.log)
  db.run('create table displays(provider_id TEXT, campaign_id TEXT, print_date TEXT, print_count INTEGER)', console.log)
  db.run('create UNIQUE INDEX displays_id on displays(provider_id, campaign_id, print_date)', console.log)
  db.run('create table payouts(provider_id TEXT, print_date TEXT, token_allocation INTEGER)', console.log)
  db.run('create UNIQUE INDEX payouts_id on payouts(provider_id, print_date)', console.log)
  db.close()
})