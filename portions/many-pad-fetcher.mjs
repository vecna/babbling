#!node_modules/.bin/zx

import hash from './id.mjs';
import semanticizeText from './semantic.mjs';
import _ from 'lodash';
import fs from 'fs-extra';

/* This script just test the connection to the etherpad server */

console.log("This want a list of pads");

if (!argv.padfile) {
  console.log(`The option --padfile is required`);
  process.exit(1);
}

const pads = fs.readFileSync(argv.padfile, 'utf-8').split("\n");
console.log(pads);

const settings = await fs.readJSON("settings.json")

const data = [];
for (const pad of pads) {
  const padId = _.startsWith(pad, 'http') ? pad.split('/').pop() : pad;
  console.log(`Acquiring now ${pad}`);
  const aquired = await processPad(padId.trim());
  if (aquired) {
    data.push(aquired);
    console.log(`This pad contains a chat with: ${JSON.stringify(_.countBy(aquired, 'type'))}`)
  }
}

/* now we've the data with all the pads, we need to produce three CSV files */

/* first file would be the CSV with URLs */
const linkdata = _.reduce(_.flatten(data), function (memo, chat) {
  if (chat.type === 'prompt') {
    memo.cache = _.pick(chat, ['researcherId', 'promptId', 'interactionCounter']);
    memo.cache.prompt = chat.text.trim();
  } else {
    _.each(chat.attributions, function (href, i) {
      const entry = {
        linkNumber: i,
        ...memo.cache,
        ..._.pick(href, ['href', 'data-citationid', 'title'])
      };
      memo.final.push(entry);
    })
    memo.cache = {};
  }
  return memo;
}, { final: [], cache: {} });

const linkCSV = jsonToCSV(linkdata.final);
const csvLinkData = path.join('merges', "exp1-links.csv");
console.log(`Saving Link CSV as ${csvLinkData}`);
fs.writeFileSync(csvLinkData, linkCSV, 'utf-8');

/* second file would be with all the answers */
const qadata = _.reduce(_.flatten(data), function(memo, chat) {
  if (chat.type === 'prompt') {
    memo.cache = _.pick(chat, ['researcherId', 'promptId', 'interactionCounter']);
    memo.cache.prompt = chat.text.trim();
  } else {
    const entry = {
      ...memo.cache,
      answer: chat.md.trim(),
    }
    memo.final.push(entry);
    memo.cache = {};
  }
  return memo;

}, { final: [], cache: {}});

const qaCSV = jsonToCSV(qadata.final);
const csvQAData = path.join('merges', "exp1-qa.csv");
console.log(`Saving Link CSV as ${csvQAData}`);
fs.writeFileSync(csvQAData, qaCSV, 'utf-8');



function jsonToCSV(jsonData) {
  const fline = _.keys(jsonData[0]);
  const csv = _.reduce(jsonData, function (memo, o) {
    // we need to ensure the order of the keys
    // is the same as fline variable
    _.each(fline, function (k) {
      memo += o[k] ? `"${o[k]}",` : ",";
    });
    memo += "\n"; // .replace(/,$/, '\n');
    return memo;
  }, fline.join(",") + "\n");
  return csv;
}

async function processPad(padId) {

  if (!padId || padId.length < 2) {
    console.log(`Pad "${padId}" has likely a wrong name: nothing to be done`);
    return null;
  }
  const padfile = path.join('merges', `${padId}.json`);

  if (fs.existsSync(padfile)) {
    console.log(`Pad ${padfile} already fetched, returning cached`);
    return fs.readJSON(padfile);
  }

  const url = `${settings.etherpad.server}/getText?padID=${padId}&apikey=${settings.etherpad.necessaryThing}`;
  const response = await fetch(url);

  if (response.ok) {
    console.log(`Pad ${padId} fetched`);
  } else {
    console.error(`Error in accessing pad ${padId}:`, response.status);
    process.exit(1);
  }

  const ethresults = await response.json();
  const content = JSON.parse(ethresults.data.text);
  fs.writeFileSync(padfile, JSON.stringify(content, null, 2));
  console.log(`Written cache file ${padfile}`);
  return content;
}

