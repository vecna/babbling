#!node_modules/.bin/zx

/* this script just test the connection to the noco server */

const settings = await fs.readJSON("settings.json")
const projectName = settings.projectName
const url = `${settings.noco.server}/db/data/v1/zero/activities`;

const result = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'xc-token': settings.noco.necessaryThing,
  },
  body: JSON.stringify({
    "Title": "test",
    "padurl": "string",
    projectName,
    "profile": "string"
  })
});

const json = await result.text();
console.log(json);

