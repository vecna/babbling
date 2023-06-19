// ==UserScript==
// @name         ChatGPT I/O collector
// @namespace    http://tampermonkey.net/
// @version      0.1.4
// @description  try to make chatbot a bit more understandable
// @author       vecna
// @match        https://chat.openai.com/*
// @icon         https://img.icons8.com/nolan/2x/chatgpt.png
// @grant        GM_setClipboard
// @require      https://code.jquery.com/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js
// ==/UserScript==

function getRandomColor() {
  // produce three random number between 0 and 255 which are the color red, green, blue
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);

  // Make a string in the right format "rgb(red, green, blue)"
  const color = "rgb(" + red + ", " + green + ", " + blue + ")";
  return color;
}

const etherpad = {
  server: "https://babbling.computer",
  necessaryThing: "f6fcc5d8877d2f9b8234d3de8d1443f9c3a8eb390939e1a557112add363caddb"
};

async function createPad(url, material) {
  // Material is a collecton that should be trasformed in the way
  // that's looks fine for the pad consumer.

  try {
    const createResponse = await fetch(url, {
      method: 'POST',
      body: `text=${encodeURIComponent(JSON.stringify(material, null, 2))}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const results = await createResponse.json();
    console.log(results);
    $("#export--button").css("background-color", getRandomColor());
    return createResponse;
  } catch (error) {
    console.log(error.message);
    return { status: 500 };
  }
}

(async function () {

  // button "export" injected in the DOM
  const exportButton = document.createElement('button');
  exportButton.id = "export--button";
  exportButton.textContent = '🗣🖥 export';
  exportButton.style.position = "fixed";
  exportButton.style.backgroundColor = "#ffffff";
  exportButton.style.border = "1px solid #202123";
  exportButton.style.left = "220px";
  exportButton.style.top = "55px";
  exportButton.style.borderRadius = "5px";
  exportButton.style.padding = "10px";

  document.body.appendChild(exportButton);

  const chatList = $('[data-projection-id="1"]');
  console.log(chatList.text());

  // Event handler for the click
  exportButton.addEventListener('click', async function () {
    // This is the logic to pick the URL, create the pad

    const chat = document.querySelectorAll('.whitespace-pre-wrap.break-words');
    // <div class=​"min-h-[20px]​ flex flex-col items-start gap-4 whitespace-pre-wrap break-words">​…​</div>​flex
    // main difference among these elements is the number of HTML child

    const material = _.map(chat, function (e, chatIndex) {
      const turndownService = new TurndownService();
      const retval = {
        type: 'prompt'
      };
      if (e.querySelector('.prose') === null) {
        console.log(`Element ${chatIndex} is a prompt`);
        // it is a prompt. Check if the prompt
        // respect our formast or if is a free format
        const babblingFormat = e.textContent.match(/$[A-Z].*:\ /);
        if (babblingFormat) {
          // it is a babbling prompt
          const chunks = e.textContent.split("\n            \n");
          retval.parameters = chunks[0];
          retval.text = chunks[1];
        } else {
          retval.type = 'free-format-prompt';
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
    if (ret.status !== 200) {
      alert(`Error recorded in creating the pad! ${ret.status}`);
    } else {
      console.log(`It should have created the pad: ${padUrl}`);
      alert(`Data sent to ${padUrl}`);
    }

    // Before I was using the clipboard with
    // GM_setClipboard(data);

  });
})();