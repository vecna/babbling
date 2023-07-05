// ==UserScript==
// @name         ChatGPT I/O collector
// @namespace    https://babbling.computer
// @version      0.1.19
// @description  A small tool to weight actual impact of prompt engineering on chatbot
// @author       vecna
// @match        https://chat.openai.com/*
// @icon         https://raw.githubusercontent.com/vecna/babbling/main/site/babbling-icon.png
// @require      https://code.jquery.com/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js
// @require      https://babbling.computer/lib/tampermonkey-utils.js
// ==/UserScript==

(async function () {

  // button "export" injected in the DOM
  const exportButton = createButton({
    position: "fixed",
    backgroundColor: "#ffffff",
    border: "1px solid #202123",
    left: "240px",
    top: "55px",
    borderRadius: "5px",
    padding: "10px",
  });
  document.body.appendChild(exportButton);

  // the input string to identify the prompt
  const promptInputBlock = createPromptLabelEntry({
    position: "fixed",
    backgroundColor: 'rgba(250, 200, 250, 0.5)',
    borderBottom: "2px solid #202123",
    left: "240px",
    top: "110px",
    borderRadius: "5px",
    padding: "10px",
    width: "400px",
    height: "30px",
    opacity: 0.5,
  });
  document.body.appendChild(promptInputBlock);

  // the input string to identify the researcher
  const researcherInputBlock = createHumanLabelEntry({
    position: "fixed",
    backgroundColor: 'rgba(200, 250, 250, 0.5)',
    borderBottom: "2px solid #202123",
    left: "240px",
    top: "165px",
    borderRadius: "5px",
    padding: "10px",
    width: "400px",
    height: "30px",
    opacity: 0.5,
  });
  document.body.appendChild(researcherInputBlock);

  const chatList = $('[data-projection-id="1"]');
  console.log(chatList.text());

  // Event handler for the click
  exportButton.addEventListener('click', async function () {
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
  });
})();
