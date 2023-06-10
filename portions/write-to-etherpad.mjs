#!node_modules/.bin/zx

/* this script just test the connection to the etherpad server */

const settings = await fs.readJSON("settings.json")
const projectName = settings.projectName
const todayString = new Date().toISOString().slice(0, 10);
const fullname = `${projectName}-${todayString}`;
const url = `${settings.etherpad.server}/createPad?apikey=${settings.etherpad.necessaryThing}&padID=${fullname}`;

let material = `
Blah blah
something [bad](https://www.google.com), something [decent](https://en.wikipedia.org), something [good](https://www.youtube.com/watch?v=dQw4w9WgXcQ).

# Lorem ipsum
Focaccia Pizza & Mandolino.
`;

const createResponse = await fetch(url, {
  method: 'POST',
  body: `text=${encodeURIComponent(material)}`,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});

if (createResponse.ok) {
  console.log(`Pad ${fullname} created`);
  const info = await createResponse.json();
  console.log(info);
} else {
  console.error(`Error in pad creation ${fullname}:`, createResponse.status);
}
