import {banner} from 'cordova-plugin-admob-free/admob';

admob.banner.config({
 id: 'ca-app-pub-3940256099942544/6300978111', // dedicated test ad unit ID for Android banners
});


// Create banner
admob.banner.prepare();

// Show the banner
admob.banner.show();

// Hide the banner
admob.banner.hide();

// Remove the banner
admob.banner.remove();
