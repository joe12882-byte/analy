import { softenPhrase } from './src/lib/gemini.ts';
console.log('Testing softenPhrase...');
const start = Date.now();
softenPhrase('el cliente se mueve', 'barber', 'professional')
  .then(res => console.log('RESULT in', Date.now() - start, 'ms:', res))
  .catch(err => console.error('ERROR in', Date.now() - start, 'ms:', err));
