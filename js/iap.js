const remove_add_id = "Remove Ads";
//const remove_add_id = "test";


function InitIAPs() {
	
	//store.QUIET or 0 to disable all logging (default)
	//store.ERROR or 1 to show only error messages
	//store.WARNING or 2 to show warnings and errors
	//store.INFO or 3 to also show information messages
	//store.DEBUG or 4 to enable internal debugging messages.
    store.verbosity = store.ERROR;

    // We register a dummy product. It's ok, it shouldn't
    // prevent the store "ready" event from firing.

	store.register({
		id:    "com.ombarus.dicedmfree.removeads",
		alias: "Remove Ads",
		type:  store.NON_CONSUMABLE
	});

    // When every goes as expected, it's time to celebrate!
    // The "ready" event should be welcomed with music and fireworks,
    // go ask your boss about it! (just in case)
    store.ready(function() {
        //console.log("\\o/ STORE READY \\o/");
    });

    // After we've done our setup, we tell the store to do
    // it's first refresh. Nothing will happen if we do not call store.refresh()
    store.refresh();
	
	
	// register events
	store.when(remove_add_id).approved(function(product) {
		$$(".popup-buy-ads").hide();
		save_data.settings.show_ads = false;
		RemoveAds();
		product.finish();
	});

	store.when(remove_add_id).cancelled(function(product) {
		CancelAlert(false);
	});

	store.when(remove_add_id).error(function(product) {
		CancelAlert(true);
	});

	store.error(function(e){
		console.log("IAP ERROR " + e.code + ": " + e.message);
	});

	store.when(remove_add_id).updated(function() {
		var product = store.get(remove_add_id);
		if (product.owned) {
			$$(".popup-buy-ads").hide();
			if (save_data.settings.show_ads != false) {
				save_data.settings.show_ads = false;
				app.form.storeFormData("save.json", save_data);
			}
			RemoveAds();
		}
		else {
			if (save_data.settings.show_ads != true) {
				$$(".popup-buy-ads").show();
				save_data.settings.show_ads = true;
				app.form.storeFormData("save.json", save_data);
				ShowAds();
			}
		}
	});
}

function IAPPrompt(name) {
	//window.alert(JSON.stringify(store.products));
	console.log(JSON.stringify(store.products));
	var product = store.get(name);
	var valid = true;
	if (!product) {
		valid = false;
		app.dialog.alert(GetLocalizedString("Product does not exist."), GetLocalizedString("IAP Error"));
	}
	else if (product.state === store.INVALID) {
		valid = false;
		app.dialog.alert(GetLocalizedString("Product is not valid."), GetLocalizedString("IAP Error"));
	}
	else if (product.state === store.REGISTERED) {
		valid = false;
		app.dialog.alert(GetLocalizedString("Transaction still underway."), GetLocalizedString("IAP Error"));
	}
	else if (product.owned) {
		valid = false;
		app.dialog.alert(GetLocalizedString("This was a one time purchase, you already own it."), GetLocalizedString("IAP Error"));
	}
	else if (!product.canPurchase) {
		valid = false;
		app.dialog.alert(GetLocalizedString("Product cannot be purchased at this time."), GetLocalizedString("IAP Error"));
	}
	if (!valid) {
		return;
	}
	
	app.dialog.confirm(product.description, product.price + " : " + product.title, function () {
		store.order(name);
	}, function() {
		CancelAlert(false);
	});
}

function CancelAlert(showError) {
	var msg = "";
	if (showError) {
		msg = store.Error.message
	}
	app.dialog.alert(msg, GetLocalizedString("Canceled"), function() {});
}