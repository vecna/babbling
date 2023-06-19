
async function fetchFromPad(padId) {
  /* this function fetch from an etherpad */
  const url = `https://babbling.computer/api/1/getText?padID=${padId}&apikey=f6fcc5d8877d2f9b8234d3de8d1443f9c3a8eb390939e1a557112add363caddb`;
  const response = await fetch(url);

  console.log(response);

  if (response.ok) {
    console.log(`Pad ${padId} fetched`);
  } else {
    throw new Error(`Error in accessing pad ${padId}:`, response.status);
  }

  const ethresults = await response.json();
  const aquired = JSON.parse(ethresults.data.text);

  console.log(aquired);
  return aquired;
}

/* This is the global variable that keeps Q&A */
let qamap = [];

/* This variable keep track of the last prompt selected */
const selected = {
  last: -1,
  current: -1,
}

async function initDiff() {

  $("#list-of-qa").empty();
  let offered = $("input[type='text']")[0].value;
  console.log(offered)
  offered = offered.length ? offered : "33b38c8c-a51e-40c9-b2a8-552de311480d";

  let data = []
  try {
    data = await fetchFromPad(offered);
  } catch (error) {
    $("#error").text(error.message);
    return;
  }

  /* from the data object we need to extract the 
   * object type 'prompt' and produce a <ol> list,
   * the content of the list if the feature 'text',
   * and the <li> need to handle a click event, because
   * we need to react by the ID selected */
  const prompts = _.filter(data, { 'type': 'prompt' }).length ?
    _.filter(data, { 'type': 'prompt' }) :
    _.filter(data, { 'type': 'babbling-prompt' });

  const promptList = document.getElementById('list-of-qa');
  _.each(prompts, (prompt, i) => {
    const promptItem = document.createElement('li');
    promptItem.setAttribute('id', `prompt-${i}`);
    prompt.id = `prompt-${i}`;
    promptItem.setAttribute('class', 'prompt');

    /* if the prompt is a babbling-prompt, we need to list params */
    if (prompt.parameters) {
      const l = _.map(prompt.parameters, function(value, paramName) {
        return `<code class="param-name">${paramName}</code> ${value}`;
      }).join(' ');
      promptItem.innerHTML = l;
    }
    else {
      promptItem.appendChild(document.createTextNode(prompt.text));
    }

    promptList.appendChild(promptItem);
  });

  /* if the prompt is a babbling-prompt, we need to put the main text on top */
  if (_.first(prompts).type === 'babbling-prompt') {
    console.log("babbling-prompt", prompts)
    const promptText = _.first(prompts).text;
    /* we need to display this text above the 'li' elements, on a dedicated div */
    $("#babbling-prompt").text(promptText);
  }

  /* now we need to initialize the display with the first */
  selected.current = 0;
  $('#prompt-0').addClass('currentp');

  qamap = _.dropRight(_.reduce(data, (memo, o) => {
    if (!_.last(memo).prompt) {
      _.last(memo).id = o.id;
      _.last(memo).prompt = o.text;

      // prompt type can be
      // 'free-format-prompt' or 'babbling-prompt'
      _.last(memo).type = o.type;
      // and 'babbling-prompt' have parameters
      if (o.paramters)
        _.last(memo).parameters = o.parameters;
    } else {
      _.last(memo).answer = o.text
      _.last(memo).md = o.md
      memo.push({});
    }
    return memo;
  }, [{}]));

  console.log(qamap)

  /* now we've initialized the data map with Q&A and an ID,
     the next changes would be triggered by the user
     clicking on the prompts */
  $('.prompt').click((event) => {
    const promptId = event.target.id;
    const promptIndex = promptId.split('-')[1];

    $(`#prompt-${selected.current}`).removeClass('currentp');
    $(`#prompt-${selected.last}`).removeClass('lastp');
    selected.last = selected.current;
    selected.current = promptIndex;

    $(`#prompt-${selected.current}`).addClass('currentp');
    $(`#prompt-${selected.last}`).addClass('lastp');

    const previous = qamap[selected.last].md
    const newly = qamap[selected.current].md

    const display = document.getElementById('display');
    display.innerHTML = '';
    displayDiff(previous, newly);
  })
}


function displayDiff(one, other) {

  const diff = Diff.diffChars(one, other),
    display = document.getElementById('display'),
    fragment = document.createDocumentFragment();

  diff.forEach((part) => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? 'green' :
      part.removed ? 'red' : 'grey';
    span = document.createElement('span');
    span.style.color = color;
    span.appendChild(document
      .createTextNode(part.value));
    fragment.appendChild(span);
  });

  display.appendChild(fragment);
}
