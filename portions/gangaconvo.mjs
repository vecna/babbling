#!node_modules/.bin/zx
import _ from 'lodash';
import fs from 'fs-extra';

console.log(`we need --source and be a JSON file`);

if (!argv.source) {
    console.log(`The option --source is required`);
    process.exit(1);
}

const content = await fs.readJSON(argv.source);

const gargantuan = _.map(content, function (e) {
    return {
        "Publication Day": 10,
        "Publication Month": 7,
        "Publication Year": 2023,
        Authors: e.researcherId,
        Title: "" + e.interactionCounter,
        Source: `${e.researcherId}-${e.interactionCounter}`,
        Abstract: e.text
    }
});

const fout = "merges/gargantuan-exp1.json";
fs.writeJSON(fout, gargantuan)
console.log(`File ${fout} produced `)