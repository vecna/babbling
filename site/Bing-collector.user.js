// ==UserScript==
// @name         Bing I/O collector
// @namespace    https://babbling.computer
// @version      0.1.39
// @description  A small tool to weight actual impact of prompt engineering on chatbot
// @author       vecna
// @match        https://www.bing.com/*
// @icon         https://raw.githubusercontent.com/vecna/babbling/main/site/babbling-icon.png
// @require      https://code.jquery.com/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js
// @require      https://babbling.computer/lib/tampermonkey-utils.js
// ==/UserScript==

// Peculiarity of bing chat is that the page can be entirely reloaded 
// and this would delete our buttons. So we need to re-inject them
// To do this, the icon of the userScript would be injected into
// h1.b_logo content, a mouseover on that icon would trigger the
// re-injection of the buttons.

(async function () {

  const babblingText = document.createElement('small');
  babblingText.textContent = 'Load Buttons';
  babblingText.style.cursor = 'copy';
  babblingText.addEventListener('mouseover', async function () {
    console.log('mouseover');
    await injectBabblingElements();
  });

  const logo = document.querySelector('h1.b_logo');
  if (logo)
    logo.appendChild(babblingText);

  if (checkChatPresence()) {
    await injectBabblingElements();
  }
})();

function checkChatPresence() {
  const cib = document.querySelector('cib-action-bar');
  return (cib?.getAttribute('mode') === 'conversation')
}

async function injectBabblingElements() {
  // all the three elements should be injected in the tab list
  // button "export" injected in the DOM

  const target = document.querySelector("#b_header");
  target.innerHTML = "<p>Babbling Experiment!</p>";
  target.style.textAlign = "center";

  const exportButton = createButton({
    backgroundColor: "#ffffff",
    border: "1px solid #202123",
    borderRadius: "5px",
    padding: "10px",
  });

  if (exportButton)
    target
      .appendChild(exportButton);

  // the input string to identify the prompt
  const promptInputBlock = createPromptLabelEntry({
    backgroundColor: 'rgba(250, 200, 250, 0.5)',
    borderBottom: "2px solid #202123",
    borderRadius: "5px",
    padding: "10px",
    width: "400px",
    height: "30px",
    opacity: 0.5,
  });

  if (promptInputBlock)
    target
      .appendChild(promptInputBlock);

  // the input string to identify the researcher
  const researcherInputBlock = createHumanLabelEntry({
    backgroundColor: 'rgba(200, 250, 250, 0.5)',
    borderBottom: "2px solid #202123",
    borderRadius: "5px",
    padding: "10px",
    width: "400px",
    height: "30px",
    opacity: 0.5,
  });

  if (researcherInputBlock)
    target
      .appendChild(researcherInputBlock);

  // Event handler for the click
  exportButton.addEventListener('click', async function () {
    // This is the logic to pick the URL, create the pad

    const researcherId = document.querySelector('#researcher--id')?.value || 'no-researcher-id';
    const promptId = document.querySelector('#prompt--id')?.value || 'no-prompt-id';

    console.log(`promptId is ${promptId} and researcherId is ${researcherId}`);

    let material = [];
    try {
      const shadows = document.querySelector("cib-serp").shadowRoot.querySelector("cib-conversation").shadowRoot.querySelectorAll('cib-chat-turn')
      if (shadows.length === 0) {
        alert('No chat found!');
        return;
      }

      material = await handleChatLeafs(shadows, promptId, researcherId);

    } catch (error) {
      console.log("Error in extracting chats", error.message);
      return;
    }

    console.log(`FYI we're talking ${JSON.stringify(material).length} bytes`);

    const padName = `${promptId}-${researcherId}-${new Date().toISOString()}`;
    const padUrl = `${etherpad.server}/p/${padName}`;
    const url = `${etherpad.server}/api/1/createPad?apikey=${etherpad.necessaryThing}&padID=${padName}`;

    const ret = await createPad(url, material);
    if (ret.code === 0) {
      console.log(`It should have created the pad: ${padUrl}`);
      alert(`Data sent to ${padUrl}`);
    } else {
      alert(`Error recorded in creating the pad! ${ret.message}`);
    }
  })
}

async function handleChatLeafs(chatLeafs, promptId, researcherId) {
  console.log(`This chat count of ${chatLeafs.length} interactions`);

  const nested = _.map(chatLeafs, function (e, exchangeIndex) {

    /* each entry here is a chat exchange, it has a prompt and an answer */
    const promptElement = e.shadowRoot
      .querySelector('[source="user"]').shadowRoot
      .querySelector('cib-message').shadowRoot
      .querySelector('.text-message-content');

    const answerElement = e.shadowRoot
      .querySelector('[source="bot"]').shadowRoot
      .querySelector('cib-message[type="text"]').shadowRoot
      .querySelector('cib-shared').shadowRoot
      .querySelector('.message');

    const attributions = e.shadowRoot
      .querySelector('[source="bot"]').shadowRoot
      .querySelector('cib-message[type="text"]').shadowRoot
      .querySelector('div.footer');

    console.log(promptElement.textContent, answerElement, attributions);

    const turndownService = new TurndownService();
    /* this initialize the answer */
    const promptRetval = {
      type: 'prompt',
      service: 'Bing',
      promptId,
      researcherId,
      service: 'N/A',
      gptVersion: 'N/A',
      when: new Date().toISOString(),
      interactionCounter: ((exchangeIndex + 1) * 2) - 1,
    };

    // it is a prompt. Check if the prompt
    // respect our formast or if is a free format
    const babblingFormat = promptElement.textContent.match(/\n(\ ).*[A-Z].*:\ /);
    console.log(`Extracting babbling format from: ${babblingFormat}`);
    // it should match with index: 0
    if (babblingFormat) {
      // it is a babbling prompt
      const chunks = e.textContent.split("\n            \n");
      promptRetval.parameters = _.reduce(
        chunks[0].trim().split("\n"), function (memo, e) {
          const blob = e.split(':');
          _.set(memo, blob[0].trim(), blob[1].trim());
          return memo
        }, {}
      );
      promptRetval.type = 'babbling-prompt';
      promptRetval.text = chunks[1];
    } else {
      // it should be 'free-form-prompt' but to keep legacy now is this:
      promptRetval.text = promptElement.textContent;
    }

    // and now lets parse the answer
    const answerRetval = {
      type: 'answer',
      service: 'Bing',
      promptId,
      researcherId,
      service: 'N/A',
      gptVersion: 'N/A',
      when: new Date().toISOString(),
      interactionCounter: ((exchangeIndex + 1) * 2),
    };

    answerRetval.type = 'answer'
    answerRetval.text = answerElement.textContent;
    answerRetval.attributions = attributions.innerHTML;
    answerRetval.md = turndownService.turndown(answerElement.innerHTML)

    return [promptRetval, answerRetval];
  });
  /* because every chat return an array of two objects */
  return _.flatten(nested);
}
