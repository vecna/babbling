#!node_modules/.bin/zx
import _ from 'lodash';
import fs from 'fs-extra';
const querystring = require('querystring');

import markdownS from 'markdown-it';
import markdownitPlainText from 'markdown-it-plain-text'
const markdownIT = markdownS().use(markdownitPlainText);

/* This script just test the connection to the etherpad server */

console.log("This want a list of pads");

if (!argv.padfile) {
  console.log(`The option --padfile is required`);
  process.exit(1);
}

if (!argv.exp) {
  console.log(`The option --exp is the experiment name: required`);
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

console.log(`Link CSV generation:`)
/* first file would be the CSV with URLs */
const linkdata = _.reduce(_.flatten(data), function (memo, chat) {
  if (chat.type === 'prompt') {
    memo.cache = _.pick(chat, ['researcherId', 'promptId', 'interactionCounter']);
    memo.cache.prompt = chat.text.trim();
  } else {
    _.each(chat.attributions, function (href, i) {
      const entry = {
        ranking: i + 1,
        ...memo.cache,
        ..._.pick(href, ['href', 'data-citationid', 'title'])
      };
      memo.final.push(entry);
    })
    if(chat?.attributions.length)
      memo.cache = {};
    if(memo.cache?.prompt?.length) {
      console.log(`${memo.cache.promptId} ${memo.cache.researcherId} INTERACTION ${memo.cache.interactionCounter} has zero links!`);
    }
    memo.cache = {};
  }
  return memo;
}, { final: [], cache: {} });

const linkCSV = jsonToCSV(linkdata.final);
const csvLinkData = path.join('merges', argv.exp, `${argv.exp}-links.csv`);
console.log(`Saving Link CSV as ${csvLinkData}`);
fs.writeFileSync(csvLinkData, linkCSV, 'utf-8');

const jsonLinkData = path.join('merges', argv.exp, `${argv.exp}-links.json`);
console.log(`Saving Link JSON as ${jsonLinkData}`);
fs.writeFileSync(jsonLinkData, JSON.stringify(linkdata.final, null ,2), 'utf-8');

const dotcsv = _.reduce(linkdata.final, (memo, e) => {
  memo += `"${e.researcherId.replace(/\ /, '_')}-${e.promptId}-${e.interactionCounter}","${e.href}"\n`;
  return memo
}, "one,two\n");
const csvfiledot = path.join('merges', argv.exp, `${argv.exp}-dot.csv`);
console.log(`Saving dot CSV as ${csvfiledot}`)
fs.writeFileSync(csvfiledot, dotcsv, 'utf-8');

/* second file would be with all the answers */
const qadata = _.reduce(_.flatten(data), function (memo, chat) {
  if (chat.type === 'prompt') {
    memo.cache = _.pick(chat, ['researcherId', 'promptId', 'interactionCounter']);
    memo.cache.prompt = chat.text.trim();
  } else {
    const entry = {
      ...memo.cache,
      answer: chat.md.trim().replace(/[\n\r]/g, '').replace(/"/g, '〃'),
      html: markdownIT.render(chat.md.replace(/"/g, '〃').replace(/[\n\r]/g, '')),
      text: markdownIT.plainText.replace(/[\n\r]/g, '').replace(/"/g, '〃'),
    }
    memo.final.push(entry);
    memo.cache = {};
  }
  return memo;

}, { final: [], cache: {} });

/* const qaCSV = jsonToCSV(qadata.final);
const csvQAData = path.join('merges', PATH BROKEN `${experiment}-qa.csv`);
console.log(`Saving Link CSV as ${csvQAData}`);
fs.writeFileSync(csvQAData, qaCSV, 'utf-8'); */

const jsonQAData = path.join('merges', argv.exp, `${argv.exp}-qa.json`);
fs.writeFileSync(jsonQAData,
  JSON.stringify(qadata.final, null, 2),
  'utf-8');

/* third file would be with all the semantic annotations */
const annotated = [];
for (const entry of qadata.final) {

  const parameters = {
    token: settings.semantic.necessaryThing,
    text: entry.text,
    "social.hashtag": false,
  };
  const url =   settings.semantic.server;
  const fullUrl = `${url}?${querystring.encode(parameters)}`

  const r = await fetch(fullUrl);
  if (!r.ok) {
    console.log(`Error in accessing semanticize server: ${r.status}`);
  }

  const result = await r.json()
  _.each(result.annotations, function (annotation, semanticNumber) {
    const o = {
      semanticNumber: semanticNumber + 1,
      ..._.pick(annotation, ['confidence', 'title', 'uri', 'label' ]),
      ..._.pick(entry, ['text', 'researcherId','promptId','interactionCounter','prompt']),
    }
    annotated.push(o);
  });
}

/* const semanticCSV =  jsonToCSV(annotated);
const semaFile = path.join('merges', PATH BROKEN `${experiment}-semantics.csv`);
console.log(`Saving Link CSV as ${semaFile}`);
fs.writeFileSync(semaFile, semanticCSV, 'utf-8'); */

const jsonsemant = path.join('merges', argv.exp, `${argv.exp}-semantics.json`);
fs.writeFileSync(jsonsemant, JSON.stringify(annotated, null, 2), 'utf-8');

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
  const padfile = path.join('merges', argv.exp, `${padId}.json`);

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
  console.log(JSON.stringify(ethresults, null ,2));
  const content = JSON.parse(ethresults.data.text);
  fs.writeFileSync(padfile, JSON.stringify(content, null, 2));
  console.log(`Written cache file ${padfile}`);
  return content;
}
