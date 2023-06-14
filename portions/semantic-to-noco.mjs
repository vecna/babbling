#!node_modules/.bin/zx

/* this script just test the connection to the noco server */

import _ from 'lodash';
import crypto from 'crypto';


function calculateHash(input) {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex').substring(0, 20);
}

if (!argv.pad) {
  console.log(`The option --pad is required`);
  process.exit(1);
}

const padName = _.startsWith('http', argv.pad) ? argv.pad.split('/').pop() : argv.pad;
const padfile = path.join('semantics', `${padName}.json`);
console.log(`Checking semantic annotation in : ${padfile}`);

if (!fs.existsSync(padfile)) {
  console.log(`${padName} has not been fetched, use 'etherpad-to-semantic.mjs'`);
  process.exit(0);
}

const semantic = await fs.readJSON(padfile);
const body = [];
for(const o of semantic) {
  for(const a of o.annotations) {
    const annotation = {
      ..._.pick(a, ['start', 'end', 'confidence', 'title', 'uri', 'label']),
      match: a.spot,
      chatId: argv.pad,
      ..._.pick(o, ['counter', 'type', 'size']),
      exchangeId: o.hash,
      // exchangeId: await calculateHash(`${o.hash}-${o.counter}`),
    };
    body.push(annotation);
  }
}

console.log(`Ready ${body.length} annotations from ${padfile}`);

// console.log(JSON.stringify(body, null, 2));

const settings = await fs.readJSON("settings.json")
const url = `${settings.noco.server}/db/data/v1/zero/annotations2`;
for (const a of body) {
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xc-token': settings.noco.necessaryThing,
    },
    body: JSON.stringify(a)
  });
}

console.log(`Done, sent ${body.length} annotations to ${settings.noco.server}`);
