
function initPromptGenerator() {
    console.log(`Noting to initialize yet`);
}

async function calculateHash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex.substring(0, 20);
}

function acquirePrompt(value) {

    const lowered = value.toLowerCase();

    if (lowered.match(/\n/))
        return lowered.split("\n");
    else
        return lowered;

}

async function generatePrompt() {
    const mapinfo = {
        textarea1: "Tone",
        textarea2: "Format",
        textarea3: "Act as",
        textarea4: "Objective"
    }

    const infopoints = _.reduce(mapinfo, (memo, promptDet, textareaN) => {

        const x = document.getElementById(textareaN);
        if (!(x.value && x.value.length > 0))
            return memo;

        memo[promptDet] = acquirePrompt(x.value.toLowerCase());
        return memo;
    }, {});

    const subject = document.getElementById("subject").value;
    if (!subject || subject.length == 0) {
        document.getElementById("prompt-list").parentNode.innerHTML = `<img src="/prompt/subject-missing.jpeg" />`;
        return;
    }

    console.log(infopoints);

    /* there are also two possible dynamic prompts */
    const dn1 = document.getElementById("name-dyn-1").value;
    const dv1 = document.getElementById("value-dyn-1").value;

    if (dn1.length && dv1.length) {
        /* we need to update the list of parameters and expand infopoints */
        mapinfo[`${_.random(0, 0xfffff)}`] = dn1;
        infopoints[dn1] = acquirePrompt(dv1.toLowerCase());
    }

    const dn2 = document.getElementById("name-dyn-2").value;
    const dv2 = document.getElementById("value-dyn-2").value;

    if (dn2.length && dv2.length) {
        /* we need to update the list of parameters and expand infopoints */
        mapinfo[`${_.random(0, 0xfffff)}`] = dn2;
        infopoints[dn2] = acquirePrompt(dv2.toLowerCase());
    }

    /* infopoints is a mixed list. the elements might be string or lists of strings,
       In the next function we need to multiply the prompts potentially produced */
    let prompts = [{
        subject
    }];
    _.each(_.values(mapinfo), (prinfo) => {
        if (_.isString(infopoints[prinfo])) {
            /* if is a string we simply need to add a property to 'prompts',
               and because is a list we need to loop and update those */
            _.each(prompts, (prompt) => {
                prompt[prinfo] = infopoints[prinfo];
            });
        } else if (_.isArray(infopoints[prinfo])) {
            /* if is a list we need to multiply the prompts */
            const newprompts = [];
            _.each(infopoints[prinfo], (value) => {
                _.each(prompts, (prompt) => {
                    const newprompt = _.cloneDeep(prompt);
                    newprompt[prinfo] = value;
                    newprompts.push(newprompt);
                });
            })
            prompts = newprompts;
        }
        /* else, the human hasn't supply the prompt detail and the loop continue */
    });

    /* now we should calculate the hash for each prompt */
    for (const prompt of prompts) {
        prompt.hash = await calculateHash(JSON.stringify(prompt));
    }

    const parametersHash = await calculateHash(JSON.stringify(prompts));
    /* parametersHash need to be converted into 3 random words taken from the 
       list 'foodwords' and separated by a '-' */
    const first = parametersHash.replace(/[a-f]/g, '1');
    const second = parametersHash.replace(/[a-f]/g, '2');
    const third = parametersHash.replace(/[a-f]/g, '3');
    const wordsHash = `${foodwords[_.parseInt(first) % foodwords.length]}-${foodwords[_.parseInt(second) % foodwords.length]}-${foodwords[_.parseInt(third) % foodwords.length]}`;
    document.getElementById("prompt--id").innerHTML =
        `<p>Prompt identifier: <code>${wordsHash}</code></p>`;

    const html = produceHTML(prompts);
    document.getElementById("prompt-list").innerHTML = html;
}

function produceHTML(prompts) {
    /* this function should produce the html for the prompts,
       each prompt would appear in the grid, and would have a 'copy' button,
       it would be rendered in a small text as a preview */

    const html = _.reduce(prompts, (memo, prompt) => {

        let parameters = "";
        _.each(_.keys(_.omit(prompt, ['hash', 'subject'])), (key) => {
            parameters += `${key.toUpperCase()}: ${prompt[key]}<br>\n`;
        })

        const promptHTML = `<div class="grid-item">
          <div class="prompt" id="prompt--${prompt.hash}">
            ${parameters}  
            <br/>
            ${prompt.subject}
          </div>
          <div class="button-list">
            <button class="prompt-copy" id="copy--${prompt.hash}" onclick="copyToClipboard('${prompt.hash}')">Copy prompt</button>
            <button class="prompt-copy" onclick="alert('Not implemented')">Visit ${prompt.hash}</button>
          </div>
        </div>`;
        return memo + promptHTML;
    }, "");
    return html;
}

function copyToClipboard(hash) {
    /* pick the text into the element with id prompt--${hash}, and copy to the clipboard */
    const e = document.getElementById(`prompt--${hash}`);
    e.style.backgroundColor = 'yellow';
    navigator.clipboard.writeText(e.textContent);
    $(`#copy--${hash}`).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
}