#!node_modules/.bin/zx
import _ from 'lodash';
import fs from 'fs-extra';


if (!argv.source) {
    console.log(`The option --source is required, need to be a -qa.json file`);
    process.exit(1);
}

if (!argv.exp) {
    console.log(`--exp it is mandatory and should be the experiment name`);
    process.exit(1)
}

console.log(`options --aicentipaid and/or --gargantuan are expected`);

const content = await fs.readJSON(argv.source);

if (!!argv.aicentipaid) {
    AIcentipAId()
}

if (argv.gargantuan) {

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

    const fout = "merges/personalization/gargantuan.json";
    fs.writeJSON(fout, gargantuan)
    console.log(`File ${fout} produced `)
}

function AIcentipAId() {
    /* for each researcher and promptId we need to take
     * only a speicific interactionCounter (of 3) and 
     * produce a json file with the following structure:
     - promptId
     - researcherId
     - text which should be a chain of all the .text */

    const grouped = _.groupBy(content, 'promptId');
    const result = [];
    _.each(grouped, function (plist, pid) {
        const byres = _.groupBy(plist, 'researcherId');
        _.each(byres, function (rlist, rid) {
            const retb = {
                ..._.pick(rlist[0], ['researcherId', 'promptId']),
                text: _.map(rlist, 'text').join("\n")
            }
            result.push(retb);
        });
    });

    const centipf = path.join('merges', argv.exp, `aicentipaid.json`);
    fs.writeFileSync(centipf, JSON.stringify(result, null, 2));
    console.log(`Produced file ${centipf}`)
}

/*

You have to act like a robot that transform my JSON input into JSON output after some analysis. You should produce the JSON in the `code` tag, so I can easily select and copy paste later.

For each JSON object with a 'text' field, the 'text' need to be analyzed as such:
a) GPT must split in sentences the text.
b) GPT must infer the subject and replace pronouns with the subject's name, and report the full name.
c) GPT analyze the sentence and extract the subject, verb, and object complement.
d) The object complement is limited to one or two words maximum.
e) the verb is limited to one word.
f) GPT assign a unique "counter" value to each entry.

After these steps, GPT creates a JSON collection that includes the researcherId, promptId, 
and an array of entries representing each analyzed sentence.

When the user write the keyword "TOTALE" GPT should take all the produced JSON and embed in every object also
the related 'researcherId', 'promptId' and 'interactionCounter'.
*/