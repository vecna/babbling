#!node_modules/.bin/zx

import hash from './id.mjs';
import semanticizeText from './semantic.mjs';
import _ from 'lodash';
/* This script just test the connection to the etherpad server */

if(!argv.pad) {
  console.log(`The option --pad is required`);
  process.exit(1);
}

const settings = await fs.readJSON("settings.json")
const padName = _.startsWith('http', argv.pad) ? argv.pad.split('/').pop() : argv.pad;
console.log(`Pad name: ${padName}`);
const url = `${settings.etherpad.server}/getText?padID=${padName}&apikey=${settings.etherpad.necessaryThing}`;

const response = await fetch(url);

if (response.ok) {
  console.log(`Pad ${padName} fetched`);
} else {
  console.error(`Error in accessing pad ${padName}:`, response.status);
  process.exit(1);
}

const ethresults = await response.json();
const aquired = JSON.parse(ethresults.data.text);

console.log(`This pad contains a chat with: ${JSON.stringify(_.countBy(aquired, 'type'))}`)
/* Now for each piece of text, we need to attribute a 
 * global counter and to call the function semanticizeText */

let counter = 0;
const material = _.reduce(aquired, (memo, exchange) => {
  const o = {
    counter,
    type: exchange.type,
    size: exchange.text.length,
    text: exchange.text,
    hash: hash(`${exchange.text}${exchange.type}`)
  }
  counter++;
  memo.push(o);
  return memo;
}, []);

/* Calculate how many unique hashes we have */
const uniqueHashes = _.uniq(_.map(material, 'hash'));
console.log(`Transformed in ${material.length} exchanges, with ${uniqueHashes.length} unique hashes`);

for (const exchange of material) {
  const annotations = await semanticizeText(settings.semantic.server, settings.semantic.necessaryThing, exchange.text);
  exchange.annotations = annotations;
}

console.log(JSON.stringify(material, null, 2));