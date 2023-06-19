#!node_modules/.bin/zx

/* this script just test the connection to the noco server */

import _ from 'lodash';

if(!argv.chatId) {
  console.log(`The option --chatId (same value as --pad) is required`);
  process.exit(1);
}

const settings = await fs.readJSON("settings.json")
const url = `${settings.noco.server}/db/data/v1/zero/annotations2?limit=1000`;
const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'xc-token': settings.noco.necessaryThing,
    },
  });

const alldata = await r.json();
const data = _.filter(alldata.list, {chatId: argv.chatId});

if(data.length === 0) {
  console.log(`No data for chatId ${argv.chatId}`);
  process.exit(1);
}

const fname = `./${argv.chatId}-dump.json`;
fs.writeJSON(fname, data, {spaces: 2});
console.log(`Produced ${fname}`);
