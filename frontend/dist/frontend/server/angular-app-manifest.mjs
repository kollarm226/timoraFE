
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/login",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/login"
  },
  {
    "renderMode": 2,
    "route": "/register"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 24440, hash: 'b9a12f34043c1c46bce7d43a575101cc41f9f439e4e25f1b49ea2576efe3af29', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17136, hash: '86ba9ec416e14a2560dd2a3705adc6e1482e425c64da4db9917cd5ee75d2741a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'login/index.html': {size: 28673, hash: '6904b4e2b81f59de82d531e346d15606baec736148e4a08f0fe9406592cd1661', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'register/index.html': {size: 29947, hash: '13548824f7fdf590b62dc838c9ac3c31223fd2eaf87b25500e6bfa754448f546', text: () => import('./assets-chunks/register_index_html.mjs').then(m => m.default)},
    'styles-K3RSJSSK.css': {size: 10512, hash: 'xhRxZpnmscM', text: () => import('./assets-chunks/styles-K3RSJSSK_css.mjs').then(m => m.default)}
  },
};
