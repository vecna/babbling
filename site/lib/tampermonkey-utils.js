
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
    $("#export--button").css("background-color", getRandomColor());
    return results;
  } catch (error) {
    console.log(error.message);
    return { code: 500, message: error.message };
  }
}

function createButton() {
  if (document.querySelector('#export--button')) {
    console.log('export--button already exists');
    return null;
  }

  const btn = document.createElement('button');
  btn.id = "export--button";
  btn.textContent = '🗣🖥 export';
  btn.style = style;
  return btn;
}

function createPromptLabelEntry(style) {
  if (document.querySelector('#prompt--id')) {
    console.log('prompt--id already exists');
    return null;
  }
  /* the input block is an <input type=text> larger twice 
  the size of the button, right below the button, and 
  it has an ID that allow us later to pick the value */
  const inputBlock = document.createElement('input');
  inputBlock.id = "prompt--id";
  inputBlock.placeholder = "    Prompt identifier";
  inputBlock.style = style;
 
  return inputBlock;
}

function createHumanLabelEntry(style) {
  if (document.querySelector('#researcher--id')) {
    console.log('researcher--id already exists');
    return null;
  }
  /* the input block is an <input type=text> larger twice 
  the size of the button, right below the button, and 
  it has an ID that allow us later to pick the value */
  const inputBlock = document.createElement('input');
  inputBlock.id = "researcher--id";
  inputBlock.placeholder = "    Researcher identifier";
  inputBlock.style = style;

  return inputBlock;
}
