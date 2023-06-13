import crypto from 'crypto';
import L from 'debug';
const debug = L('lib:semantic');
const querystring = require('querystring');

export default async function semanticizeText(url, token, text) {

  const parameters = {
    token,
    text,
    "social.hashtag": true,
  };
  const fullUrl = `${url}?${querystring.encode(parameters)}`

  const r = await fetch(fullUrl);
  if (!r.ok) {
    debug(`Error in accessing semanticize server: ${r.status}`);
    return;
  }

  const result = await r.json()
  /* {"time":8,"annotations":[{
        "start":6,
        "end":8,
        "spot":"AI",
        "confidence":0.698,
        "id":1164,
        "title":"Artificial intelligence",
        "uri":"http://en.wikipedia.org/wiki/Artificial_intelligence",
        "label":"Artificial intelligence"
      },{
        "start":9,
        "end":23,
        "spot":"language model",
        "confidence":0.7867,
        "id":1911810,
        "title":"Language model",
        "uri":"http://en.wikipedia.org/wiki/Language_model",
        "label":"Language model"
      },{
        "start":70,
        "end":79,
        "spot":"knowledge",
        "confidence":0.6248,
        "id":243391,
        "title":"Knowledge",
        "uri":"http://en.wikipedia.org/wiki/Knowledge",
        "label":"Knowledge"
      },{
        "start":106,
        "end":112,
        "spot":"OpenAI",
        "confidence":0.8873,
        "id":48795986,
        "title":"OpenAI",
        "uri":"http://en.wikipedia.org/wiki/OpenAI",
        "label":"OpenAI"
      },{
        "start":334,
        "end":340,
        "spot":"OpenAI",
        "confidence":0.8873,
        "id":48795986,
        "title":"OpenAI",
        "uri":"http://en.wikipedia.org/wiki/OpenAI",
        "label":"OpenAI"
      }],
      "lang":"en","langConfidence":1.0,"timestamp":"2023-06-13T15:15:09.512"}
  */
  return result.annotations;
}