
function initPromptGenerator() {

}

async function calculateHash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex.substring(0, 20);
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
        
        const lowered = x.value.toLowerCase();

        if (lowered.match(/\n/))
            memo[promptDet] = lowered.split("\n");
        else
            memo[promptDet] = lowered;

        return memo;
    }, {});

    const subject = document.getElementById("subject").value;
    if (!subject || subject.length == 0) {
        document.getElementById("prompt-list").textContent = "Subject is required";
        return;
    }

    console.log(infopoints);

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

    console.log(prompts);
    const html = produceHTML(prompts);
    document.getElementById("prompt-list").innerHTML = html;
}

function produceHTML(prompts) {
    /* this function should produce the html for the prompts,
       each prompt would appear in the grid, and would have a 'copy' button,
       it would be rendered in a small text as a preview */

    const html = _.reduce(prompts, (memo, prompt) => {
        const promptHTML = `<div class="grid-item">
          <div class="prompt" id="prompt--${prompt.hash}">
            ${prompt.Tone ? `TONE: ${prompt.Tone}<br>` : "" }
            ${prompt.Format ? `FORMAT: ${prompt.Format}<br>` : "" }
            ${prompt["Act as"] ? `ACT AS: ${prompt["Act as"]}<br>` : "" }
            ${prompt.Objective ? `OBJECTIVE: ${prompt.Objective}<br>` : ""}
            <br/>
            ${prompt.subject}
          </div>
          <div class="button-list">
            <button class="prompt-copy" id="copy--${prompt.hash}" onclick="copyToClipboard('${prompt.hash}')">Copy prompt</button>
            <button class="prompt-copy" onclick="copyToClipboard('${prompt.hash}')">Visit ${prompt.hash}</button>
          </div>
        </div>`;
        return memo + promptHTML;
    }
    , "");
    return html;
}

function copyToClipboard(hash) {
  /* pick the text into the element with id prompt--${hash}, and copy to the clipboard */
    const text = document.getElementById(`prompt--${hash}`).textContent;
    navigator.clipboard.writeText(text);
    $(`#copy--${hash}`).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);

}