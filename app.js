if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/cardamom/sw.js').then((reg) => {
    if(reg.installing) {
      document.getElementById('appstatus').innerText = 'Service worker installing';
    } else if(reg.waiting) {
      document.getElementById('appstatus').innerText = 'Service worker installed';
    } else if(reg.active) {
      document.getElementById('appstatus').innerText = 'Service worker active';
    }
  });
}
