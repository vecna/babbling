import crypto from 'crypto';
import L from 'debug';
const debug = L('lib:id');

export default function hash(input) {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(input);
  const id = sha1sum.digest('hex');
  debug(`[${input}] → id [${id}]`);
  return id;
}
