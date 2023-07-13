#!node_modules/.bin/zx
import _ from 'lodash';
import fs from 'fs-extra';
import { argv } from 'zx';

console.log(`This script produces a bunch of different output, take as input the semantics`);

if (!argv.output) {
    console.log(`The option --output is required and would be a portion of the file name`);
    process.exit(1);
}
if (!argv.exp) {
    console.log(`The option --exp is the experiment name: required`);
    process.exit(1);
}

if (!argv.semantic) {
    console.log(`The option --semantic is required`);
    process.exit(1);
}
const allthe = await fs.readJSON(argv.semantic);

console.log(`Mandatory options are --erre or --labelCounter`);

if (argv.erre)
    erreProducer();
if (argv.labelCounter)
    labelCounter();

/* {
    "semanticNumber": 1,
    "confidence": 0.9096,
    "title": "Mark Rutte",
    "uri": "http://en.wikipedia.org/wiki/Mark_Rutte",
    "label": "Mark Rutte",
    "text": "Mark Rutte became the Prime Minister of the Netherlands on October 14, 2010 1 . He is the longest-serving Dutch prime minister2 . Is there anything else you would like to know about him? ",
    "researcherId": "Claudio",
    "promptId": "exp1",
    "interactionCounter": 1,
    "prompt": "When did Mark Rutte become prime minister?"
   }, */

function labelCounter() {

    const content = _.filter(allthe, function (e) { return e.confidence > 0.8 })

    const result = [];
    _.each(_.groupBy(content, 'promptId'), function (plist, pid) {
        console.log(`Prompt ${pid} has ${plist.length} stuff`);
        _.each(_.groupBy(plist, 'interactionCounter'), function (selected, ic) {
            console.log(`Prompt ${pid} ic ${ic} has ${selected.length} labels `);
            /* now let's take all the unique occurences of labels */
            const labels = _.uniq(_.map(selected, 'label'));
            /* now for each label we need to count if all the researcher have it */
            _.each(labels, function (label) {
                const x = _.countBy(_.filter(selected, { label }), 'researcherId');
                const y = _.keys(x);
                console.log(`Label ${label} has ${y.length} = ${JSON.stringify(y)} and ${JSON.stringify(x)} `);
                if (y.length == 6) {
                    console.log(`Removing ${label}`);
                } else {
                    result.push({
                        label,
                        question: ic,
                        appearedOnly: y.length,
                        promptId: pid,
                    });
                }
            })
        })
    });

    const fname = `merges/${argv.exp}/${argv.output}-numered-semantics.json`;
    console.log(`Writing ${fname} ${result.length} elements`);
    fs.writeFileSync(fname, JSON.stringify(result, null, 2));

}


function erreProducer() {

    const erre = _.map(allthe, function (e) {
        return _.pick(e, ["label", "title", "confidence", "researcherId", "interactionCounter"])
    });

    const fout = `merges/${argv.exp}/${argv.output}-erre.json`;
    fs.writeJSON(fout, erre)
    console.log(`File ${fout} produced `)
}