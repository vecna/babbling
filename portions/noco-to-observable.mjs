#!node_modules/.bin/zx

/* this script just test the connection to the noco server */

import _ from 'lodash';

const settings = await fs.readJSON("settings.json")
const url = `${settings.noco.server}/db/data/v1/zero/annotations2?limit=1000`;
const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'xc-token': settings.noco.necessaryThing,
    },
  });

const data = await r.json();

fs.writeJSON("./noco-dump.json", data.list, {spaces: 2});
console.log(`Produced ./noco-dump.json`);
