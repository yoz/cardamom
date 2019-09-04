if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/cardamom/sw.js').then((reg) => {
    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }
  });
}
