//import {banner} from 'cordova-plugin-admob-free/admob';
const use_test = false;

function InitAdMob() {
	
	if (use_test) {
		window.admob.banner.config({
			id: 'ca-app-pub-3940256099942544/6300978111' // dedicated test ad unit ID for Android banners
			//id: 'ca-app-pub-8275293921068244/9979789113', // official unit ID. DO NOT CLICK ADS !
		});
	}
	else if(Framework7.device.ios){
		window.admob.banner.config({
			id: 'ca-app-pub-8275293921068244/5187261891'
			//id: 'ca-app-pub-3940256099942544/6300978111', // dedicated test ad unit ID for Android banners
			//id: 'ca-app-pub-8275293921068244/9979789113', // official (ios) unit ID. DO NOT CLICK ADS !
		});
	}
	else {
		window.admob.banner.config({
			//id: 'ca-app-pub-3940256099942544/6300978111' // dedicated test ad unit ID for Android banners
			id: 'ca-app-pub-8275293921068244/9979789113', // official (android) unit ID. DO NOT CLICK ADS !
		});
	}

	// Create banner
	if (save_data.settings.show_ads) {
		window.admob.banner.prepare();
	}

	// Show the banner
	//window.admob.banner.show();

	// Hide the banner
	//window.admob.banner.hide();

	// Remove the banner
	//window.admob.banner.remove();

}

function RemoveAds() {
	window.admob.banner.remove();
}

function ShowAds() {
	window.admob.banner.prepare(); // auto-show on prepare
}

function adsleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

window.addEventListener("orientationchange", function(){
	if (document != undefined && save_data.settings.show_ads) {
		//console.log("Orientation Changed " + screen.orientation.type);
		//window.alert("Orientation changed : " + screen.orientation.type); // e.g. portrait
		window.admob.banner.remove().then( function() {return adsleep(1000);} ).then( function() { window.admob.banner.prepare(); } );
	}
});

document.addEventListener('admob.banner.events.LOAD_FAIL', function(event) {
	//window.alert("ADMOB EVENT : Load Fail");
	console.log(event);
});

document.addEventListener('admob.banner.events.LOAD', function(event) {
	//window.alert("ADMOB EVENT : Load");
});

document.addEventListener('admob.banner.events.OPEN', function(event) {
	//window.alert("ADMOB EVENT : Open");
});

document.addEventListener('admob.banner.events.CLOSE', function(event) {
	//window.alert("ADMOB EVENT : Close");
});

document.addEventListener('admob.banner.events.EXIT_APP', function(event) {
	//window.alert("ADMOB EVENT : Exit App");
	window.admob.banner.hide().then( window.admob.banner.remove() );
});
