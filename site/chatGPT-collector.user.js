// ==UserScript==
// @name         ChatGPT I/O collector
// @namespace    chatGPT-babbling-collector
// @version      0.2.0
// @description  A small tool to weight actual impact of prompt engineering on chatbot
// @author       vecna
// @match        https://chat.openai.com/*
// @icon         https://raw.githubusercontent.com/vecna/babbling/main/site/babbling-icon.png
// @require      https://code.jquery.com/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js
// @require      http://localhost:8000/lib/tampermonkey-utils.js
// ==/UserScript==

// @require      https://babbling.computer/lib/tampermonkey-utils.js

(async function () {

  console.log("Injecting buttons and input fields");

  // button "export" injected in the DOM
  const exportButton = createButton()
  exportButton.style.position = "fixed";
  exportButton.style.backgroundColor = "#ffffff";
  exportButton.style.border = "1px solid #202123";
  exportButton.style.borderRadius = "5px";
  exportButton.style.padding = "10px";
  exportButton.style.left = "240px";
  exportButton.style.top = "55px";
  exportButton.style.zIndex = 1000;
  document.body.appendChild(exportButton);

  // the input string to identify the prompt
  const promptInputBlock = createPromptLabelEntry()
  promptInputBlock.style.position = "fixed";
  promptInputBlock.style.backgroundColor = 'rgba(250, 200, 250, 0.5)';
  promptInputBlock.style.borderBottom = "2px solid #202123";
  promptInputBlock.style.left = "240px";
  promptInputBlock.style.top = "110px";
  promptInputBlock.style.borderRadius = "5px";
  promptInputBlock.style.padding = "10px";
  promptInputBlock.style.width = "400px";
  promptInputBlock.style.height = "30px";
  promptInputBlock.style.opacity = 0.5;
  document.body.appendChild(promptInputBlock);

  // the input string to identify the researcher
  const researcherInputBlock = createHumanLabelEntry()
  researcherInputBlock.style.position = "fixed";
  researcherInputBlock.style.backgroundColor = 'rgba(200, 250, 250, 0.5)';
  researcherInputBlock.style.borderBottom = "2px solid #202123";
  researcherInputBlock.style.left = "240px";
  researcherInputBlock.style.top = "165px";
  researcherInputBlock.style.borderRadius = "5px";
  researcherInputBlock.style.padding = "10px";
  researcherInputBlock.style.width = "400px";
  researcherInputBlock.style.height = "30px";
  researcherInputBlock.style.opacity = 0.5;
  document.body.appendChild(researcherInputBlock);

  console.log("Buttons and input fields injected");
  // Event handler for the click
  exportButton.addEventListener('click', handleClickGPT);

})();

async function handleClickGPT() {
  // This is the logic to pick the URL, create the pad

  const chat = document.querySelectorAll('.whitespace-pre-wrap.break-words');
  // <div class=​"min-h-[20px]​ flex flex-col items-start gap-4 whitespace-pre-wrap break-words">​…​</div>​flex
  // main difference among these elements is the number of HTML child

  const researcherId = document.querySelector('#researcher--id')?.value || 'no-researcher-id';
  const promptId = document.querySelector('#prompt--id')?.value || 'no-prompt-id';

  console.log(`promptId is ${promptId} and researcherId is ${researcherId}`);

  // detect if we are in the correct URL format and detect the kind of service we're using
  if (window.location?.search[0] == '?') {
    alert(`Wrong URL! please select the chat from the LEFT COLUMN`);
    return;
  }

  // spot the kind of service 
  const x = document.querySelectorAll(".justify-center.bg-gray-50")
  // there can be or `null` or a list with one element. When is `null` we're in the
  // UNPAID service of openAI, when there is one element we're in the PAID service
  // and in this second case we need to take the .textContent of the element because 
  // would be sent. 
  // The variables valorized and send are: 1) the kind of service and 2) the text

  const service = x?.length > 0 ? 'paid ' : 'free';
  const gptVersion = x?.length > 0 ? x[0].textContent : 'free-3.5';

  const material = _.map(chat, function (e, chatIndex) {
    const turndownService = new TurndownService();
    const retval = {
      type: 'prompt',
      service: 'chatGPT',
      promptId,
      researcherId,
      service,
      gptVersion,
      when: new Date().toISOString(),
      interactionCounter: chatIndex + 1,
    };
    if (e.querySelector('.prose') === null) {
      console.log(`Element ${chatIndex} is a prompt`);
      // it is a prompt. Check if the prompt
      // respect our formast or if is a free format
      const babblingFormat = e.textContent.match(/\n(\ ).*[A-Z].*:\ /);
      console.log(babblingFormat);
      // it should match with index: 0
      if (babblingFormat) {
        // it is a babbling prompt
        const chunks = e.textContent.split("\n            \n");
        retval.parameters = _.reduce(
          chunks[0].trim().split("\n"), function (memo, e) {
            const blob = e.split(':');
            _.set(memo, blob[0].trim(), blob[1].trim());
            return memo
          }, {}
        );
        retval.type = 'babbling-prompt';
        retval.text = chunks[1];
      } else {
        // it should be 'free-form-prompt' but to keep legacy now is this:
        retval.type = 'prompt';
        retval.text = e.textContent;
      }
      return retval;
    } else {
      console.log(`Element ${chatIndex} is an answer`);
      // it is an answer: TODO can be improved in spotting
      // if there is a visible or hidden button to move among
      // different versions of the answer.
      retval.type = 'answer'
      retval.text = e.textContent;
      // html: e.innerHTML,
      retval.md = turndownService.turndown(e.innerHTML)
      return retval;
    }
  });
  console.log(`FYI we're talking ${JSON.stringify(material).length} bytes`);

  const windowUrl = window.location.href;
  const params = windowUrl.split("/");
  const padName = params[params.length - 1].replace(/#/g, '_');
  const padUrl = `${etherpad.server}/p/${padName}`;
  const url = `${etherpad.server}/api/1/createPad?apikey=${etherpad.necessaryThing}&padID=${padName}`;

  const ret = await createPad(url, material);
  if (ret.code === 0) {
    console.log(`It should have created the pad: ${padUrl}`);
    alert(`Data sent to ${padUrl}`);
  } else {
    alert(`Error recorded in creating the pad! ${ret.message}`);
  }
  // Before I was using the clipboard with
  // GM_setClipboard(data);
};
