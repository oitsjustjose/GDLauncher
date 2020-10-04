import { ipcRenderer } from 'electron';

const requestMap = {};
const typeHandlerMap = {};

window.addEventListener('__RENDERER_MESSAGE__', event => {
  ipcRenderer.send('__RENDERER_MESSAGE__', event.detail);
});

ipcRenderer.on('__MAIN_MESSAGE__', (event, data) => {
  window.dispatchEvent(new CustomEvent('__MAIN_MESSAGE__', { detail: data }));
});

window.addEventListener('__MAIN_MESSAGE__', event => {
  const data = event.detail;
  const { type, id, value, success } = data;
  console.log('RECEIVED MAIN MSG');

  if (typeof id === 'string' && id in requestMap) {
    const entry = requestMap[id];
    clearTimeout(entry.t);
    if (success) entry.resolve(value);
    else entry.reject(value);
    delete requestMap[id];
    return;
  }

  if (type in typeHandlerMap) {
    const fn = typeHandlerMap[type];
    fn(value);
    return true;
  }
});

export function handleMessage(type, fn) {
  typeHandlerMap[type] = fn;
}

export default function sendMessage(type, value) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const event = new CustomEvent('__RENDERER_MESSAGE__', {
    detail: {
      type,
      id,
      value
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(event);
  }
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error('Timeout exceeded')),
      15 * 1000
    );
    requestMap[id] = { resolve, reject, t };
  });
}