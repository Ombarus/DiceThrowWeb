//import {banner} from 'cordova-plugin-admob-free/admob';

function InitAdMob() {
	
	window.admob.banner.config({
	 id: 'ca-app-pub-3940256099942544/6300978111', // dedicated test ad unit ID for Android banners
	});

	// Create banner
	window.admob.banner.prepare();

	// Show the banner
	//window.admob.banner.show();

	// Hide the banner
	//window.admob.banner.hide();

	// Remove the banner
	//window.admob.banner.remove();

}

window.addEventListener("orientationchange", function(){
    //window.alert("Orientation changed : " + screen.orientation.type); // e.g. portrait
	window.admob.banner.remove().then( window.admob.banner.prepare() );
});

document.addEventListener('admob.banner.events.LOAD_FAIL', function(event) {
	window.alert("ADMOB EVENT : Load Fail");
	console.log(event);
});

document.addEventListener('admob.banner.events.LOAD', function(event) {
	window.alert("ADMOB EVENT : Load");
});

document.addEventListener('admob.banner.events.OPEN', function(event) {
	window.alert("ADMOB EVENT : Open");
});

document.addEventListener('admob.banner.events.CLOSE', function(event) {
	window.alert("ADMOB EVENT : Close");
});

document.addEventListener('admob.banner.events.EXIT_APP', function(event) {
	window.alert("ADMOB EVENT : Exit App");
	window.admob.banner.hide().then( window.admob.banner.remove() );
});
