// ==UserScript==
// @name         ChatGPT I/O collector
// @namespace    https://babbling.computer
// @version      0.1.13
// @description  try to make chatbot a bit more understandable
// @author       vecna
// @match        https://chat.openai.com/*
// @icon         https://img.icons8.com/nolan/2x/chatgpt.png
// @grant        GM_setClipboard
// @require      https://code.jquery.com/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js
// @require      https://TODO
// ==/UserScript==


(async function () {

  // button "export" injected in the DOM
  const exportButton = createButton();
  document.body.appendChild(exportButton);

  // and the input string to mark the chat
  const inputBlock = createInputBlock();
  document.body.appendChild(inputBlock);

  const chatList = $('[data-projection-id="1"]');
  console.log(chatList.text());

  // Event handler for the click
  exportButton.addEventListener('click', async function () {
    // This is the logic to pick the URL, create the pad

    const chat = document.querySelectorAll('.whitespace-pre-wrap.break-words');
    // <div class=​"min-h-[20px]​ flex flex-col items-start gap-4 whitespace-pre-wrap break-words">​…​</div>​flex
    // main difference among these elements is the number of HTML child

    const label = document.querySelector('#export--input').value;
    console.log(`Label is ${label}`);

    const material = _.map(chat, function (e, chatIndex) {
      const turndownService = new TurndownService();
      const retval = {
        type: 'prompt',
        label,
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
            chunks[0].trim().split("\n"), function(memo, e) {
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
        return {
          type: 'answer',
          text: e.textContent,
          // html: e.innerHTML,
          md: turndownService.turndown(e.innerHTML),
        }
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
