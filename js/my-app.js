
var twister = new MersenneTwister();

var app = new Framework7({
	root: '#app',
    routes: routes,
	pushState: true,
    panel: {
        swipe: "left",
		leftBreakpoint: 768,
    },
	view: {
		xhrCache:false
	}
});
var mainView = app.views.create('.view-main');
var $$ = Dom7;
var openedDialog = null;
var isFromIntent = false;
var isRerollFromDetail = false;

// This is not ever used except as a reference, it might not be up to date (but I try)
var sample_data = JSON.parse('{ '+
'	"version":0, ' +
'	"current_roll": [ '+
'		{"roll_data":{"dice":6,"count":3, "max":true, "min":false, "bonus":-2, "bonus_roll":0, "drop_high":0, "drop_low":0}, "results":[1,5,12]}, '+
'		{"roll_data":{"dice":8,"count":5, "max":false, "min":false, "bonus":0, "bonus_roll":0, "drop_high":0, "drop_low":0}, "results":[1,2,8,4,5]} '+
'	], '+
'	"history":[ '+
'		{ "date":"2018-08-08", "roll":[ '+
'			{"roll_data":{"dice":6,"count":3, "max":true, "min":false, "bonus":-2, "bonus_roll":0, "drop_high":0, "drop_low":0}, "results":[1,5,12]}, '+
'			{"roll_data":{"dice":8,"count":5, "max":false, "min":false, "bonus":0, "bonus_roll":0, "drop_high":0, "drop_low":0}, "results":[1,2,8,4,5]} '+
'		]}, '+
'		{ "date":"2018-08-08", "roll":[ '+
'			{"roll_data":{"dice":8,"count":5, "max":false, "min":false, "bonus":0, "bonus_roll":0, "drop_high":0, "drop_low":0}, "results":[1,2,8,4,5]} '+
'		]}, '+
'		{ "date":"2018-08-08", "roll":[ '+
'			{"roll_data":{"dice":6,"count":20, "max":true, "min":false, "bonus":-2, "bonus_roll":0, "drop_high":0, "drop_low":0}, "results":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]} '+
'		]} '+
'	], '+
'	"presets":[ '+
'		{ '+
'			"roll_data":[ '+
'				{"dice":6,"count":3, "max":true, "min":false, "bonus":-2, "bonus_roll":0, "drop_high":0, "drop_low":0}, '+
'				{"dice":8,"count":5, "max":false, "min":false, "bonus":0, "bonus_roll":0, "drop_high":0, "drop_low":0} '+
'			], '+
'			"name":"1d6+3 spellcasting" '+
'		} '+
'	],'+
'	"settings": {"first_page":"dice", "show_roll_options":true, "show_tooltips":true, "result_page:":"stats"}'+
'}');
///////

$$("#dice-side").on("formajax:success", function() {
	var val = $$("input[name='dice-side-input']").val();
	if (val > 0)
	{
		save_data.current_roll[save_data.current_roll.length-1].roll_data.dice = parseInt(val);
		app.router.navigate("/dicetypenext/");
	}
	else
	{
		console.log("error, NAN");
	}
});

function CompareRollDataArray(a, b) {
	if (a.length != b.length) {
		return false;
	}
	for (var i = 0; i < a.length; i++) {
		var keys = Object.keys(a[i].roll_data);
		for (var j = 0; j < keys.length; j++) {
			if (a[i].roll_data[keys[j]] != b[i].roll_data[keys[j]])
				return false;
		}
	}
	
	return true;
}

function MatchWithPreset(roll_data) {
	for (var i = 0; i < save_data.presets.length; i++) {
		if (CompareRollDataArray(roll_data, save_data.presets[i].roll_data) == true) {
			return save_data.presets[i].name;
		}
	}
	return null;
}

function ProcessClick(ev) {
	var btn = $$(ev.target);
	////////////
	if (btn.hasClass("save-preset")) {
		DoSavePresetEdit();
	}
	if (btn.hasClass("preset-add-roll")) {
		var root = $$(".throw_data")[0];
		var copy = root.cloneNode(true);
		$$(copy).show();
		root.parentNode.insertBefore(copy, null);
		
		var cur_data = {};
		cur_data["roll_data"] = {}
		cur_data["roll_data"]["bonus_dice"] = 0;
		cur_data["roll_data"]["bonus_roll"] = 0;
		cur_data["roll_data"]["count"] = 1;
		cur_data["roll_data"]["dice"] = 2;
		cur_data["roll_data"]["drop_high"] = 0;
		cur_data["roll_data"]["drop_low"] = 0;
		cur_data["roll_data"]["max"] = false;
		cur_data["roll_data"]["min"] = false;
		
		var child_detail_dice_face = $$(copy).find("input[name='preset-detail-dice-face']");
		app.stepper.create({"el":$$(child_detail_dice_face).parents(".stepper"), "inputEl":child_detail_dice_face, "min":2, "value":2, "manualInputMode":true});
		
		var child_detail_dice_count = $$(copy).find("input[name='preset-detail-dice-count']");
		app.stepper.create({"el":$$(child_detail_dice_count).parents(".stepper"), "inputEl":child_detail_dice_count, "min":1, "value":1, "manualInputMode":true});
		
		var child_preset_bonus_dice_slider = $$(copy).find(".preset-bonus-dice-slider");
		var child_preset_dice_bonus = $$(copy).find("input[name='preset-dice-bonus']");
		app.range.create({"el":child_preset_bonus_dice_slider, "inputEl":child_preset_dice_bonus, "label":true, "min":-10, "max":10});
		
		var child_preset_bonus_roll_slider = $$(copy).find(".preset-bonus-roll-slider");
		var child_preset_roll_bonus = $$(copy).find("input[name='preset-roll-bonus']");
		app.range.create({"el":child_preset_bonus_roll_slider, "inputEl":child_preset_roll_bonus, "label":true, "min":-10, "max":10});
		
		var child_preset_drophigh_slider = $$(copy).find(".preset-drophigh-slider");
		var child_preset_drophigh = $$(copy).find("input[name='preset-drophigh']");
		app.range.create({"el":child_preset_drophigh_slider, "inputEl":child_preset_drophigh, "label":true, "min":0, "max":10});
		
		var child_preset_droplow_slider = $$(copy).find(".preset-droplow-slider");
		var child_preset_droplow = $$(copy).find("input[name='preset-droplow']");
		app.range.create({"el":child_preset_droplow_slider, "inputEl":child_preset_droplow, "label":true, "min":0, "max":10});
		
		set_all_preset_detail(copy, cur_data);
		
		var roots = $$(".throw-id");
		for (var i = 0; i < roots.length; i++) {
			// -1 because there's the hidden "real" root that we use as reference so there's one more than actually
			$$(roots[i]).text(GetLocalizedString("Throw ") + (i-1));
		}
	}
	if (btn.hasClass("reroll-button")) {
		for (var i = 0; i < save_data.current_roll.length; i++)
		{
			save_data.current_roll[i].results = []
		}
		isFromIntent = true;
		if ($$("#tab-1").hasClass("tab-active")) {
			isRerollFromDetail = false;
		}
		else {
			isRerollFromDetail = true;
		}
		mainView.router.navigate(mainView.router.currentRoute.url, {
			reloadCurrent: true,
			ignoreCache: true,
		});
	}
	if (btn.hasClass("hback")) {
		ProcessHardwareBack();
	}
	if (btn.hasClass("dice"))
	{
		var val = btn.text();
		save_data.current_roll[save_data.current_roll.length-1].roll_data.dice = val;
	}
	if (btn.hasClass("dicecount"))
	{
		var val = btn.text();
		save_data.current_roll[save_data.current_roll.length-1].roll_data.count = val;
	}
	if (btn.hasClass("doroll"))
	{
		var rerollmax = $$("input[name='dice-reroll-max']").is(':checked');
		var rerollmin = $$("input[name='dice-reroll-min']").is(':checked');
		var dicebonus = $$("input[name='dice-bonus']").val();
		var rollbonus = $$("input[name='roll-bonus']").val();
		var drophigh = $$("input[name='drophigh']").val();
		var droplow = $$("input[name='droplow']").val();
		
		save_data.current_roll[save_data.current_roll.length-1].roll_data.max = rerollmax;
		save_data.current_roll[save_data.current_roll.length-1].roll_data.min = rerollmin;
		save_data.current_roll[save_data.current_roll.length-1].roll_data.bonus_dice = parseInt(dicebonus);
		save_data.current_roll[save_data.current_roll.length-1].roll_data.bonus_roll = parseInt(rollbonus);
		save_data.current_roll[save_data.current_roll.length-1].roll_data.drop_high = parseInt(drophigh);
		save_data.current_roll[save_data.current_roll.length-1].roll_data.drop_low = parseInt(droplow);
		
		//DoRollFromData();
	}
	if (btn.hasClass("addroll"))
	{
		var rerollmax = $$("input[name='dice-reroll-max']").is(':checked');
		var rerollmin = $$("input[name='dice-reroll-min']").is(':checked');
		var dicebonus = $$("input[name='dice-bonus']").val();
		var rollbonus = $$("input[name='roll-bonus']").val();
		var drophigh = $$("input[name='drophigh']").val();
		var droplow = $$("input[name='droplow']").val();
		
		save_data.current_roll[save_data.current_roll.length-1].roll_data.max = rerollmax;
		save_data.current_roll[save_data.current_roll.length-1].roll_data.min = rerollmin;
		save_data.current_roll[save_data.current_roll.length-1].roll_data.bonus_dice = parseInt(dicebonus);
		save_data.current_roll[save_data.current_roll.length-1].roll_data.bonus_roll = parseInt(rollbonus);
		save_data.current_roll[save_data.current_roll.length-1].roll_data.drop_high = parseInt(drophigh);
		save_data.current_roll[save_data.current_roll.length-1].roll_data.drop_low = parseInt(droplow);
		
		save_data.current_roll.push({"roll_data":{}, "results":[]});
		app.form.storeFormData("save.json", save_data);
		console.log(save_data);
	}
	if (btn.hasClass("roll-preset"))
	{
		var presetname = btn.text();
		var presetdata = null;
		for (var i = 0; i < save_data.presets.length; i++)
		{
			if (save_data.presets[i].name == presetname)
			{
				presetdata = save_data.presets[i].roll_data;
				break;
			}
		}
		if (presetdata != null) {
			save_data.current_roll = JSON.parse(JSON.stringify(presetdata));
			//DoRollFromData();
			app.router.navigate("/dicestats/");
		}
		else {
			console.log("could not find preset named " + presetname);
		}
	}
	if (btn.hasClass("dohistory")) {
		var index = parseInt(btn.find("#history-index").val());
		save_data.current_roll = JSON.parse(JSON.stringify(save_data.history[index].roll));
		app.router.navigate("/dicestats/");
	}
	if (btn.hasClass("doeraseallhistory")) {
		app.dialog.confirm(GetLocalizedString('This will clear all past rolls'), GetLocalizedString('Are you sure ?'), function () {
			save_data.history = JSON.parse('[]');
			app.form.storeFormData("save.json", save_data);
			UpdateHistoryList();
			$$(document).off("click", "a", ProcessClick).on("click", "a", ProcessClick);
			console.log(save_data);
		});		
	}
	if (btn.hasClass("doerasehistory")) {
		var index = parseInt(btn.parents(".item-content").find("#history-index").val());
		var name = btn.parents(".item-content").find(".item-title").text();
		app.dialog.confirm(GetLocalizedString('Really delete ?'), name, function () {
			save_data.history.splice(index, 1);
			app.form.storeFormData("save.json", save_data);
			UpdateHistoryList();
			$$(document).off("click", "a", ProcessClick).on("click", "a", ProcessClick);
			console.log(save_data);
		});		
	}
	if (btn.hasClass("delete-throw-confirm")) {
		var root = btn.parents(".throw_data");
		/*var presetname = $$(ev.target).parents(".item-content").find(".item-inner").text();*/
		app.dialog.confirm(GetLocalizedString('Delete Throw ?'), "", function (name) {
			root.remove();
		});
	}
	if (btn.hasClass("open-confirm"))	 {
		var presetname = $$(ev.target).parents(".item-content").find(".item-inner").text();
		app.dialog.confirm(GetLocalizedString('Delete Preset ?'), presetname, function (name) {
			for (var i = 0; i < save_data.presets.length; i++) {
				if (save_data.presets[i].name == presetname) {
					save_data.presets.splice(i, 1);
					break; // Carefull not to continue to loop here !
				}
			}
			app.form.storeFormData("save.json", save_data);
			UpdateSortablePresetList();
			// this list might stay loaded because of Ajax magic so update it too if it's there.
			if ($$("#preset-list").length != 0) {
				UpdatePresetList();
			}
			UpdateAndroidShortcuts();
			$$(document).off("click", "a", ProcessClick).on("click", "a", ProcessClick);
		});
	}
}

function AddHistory(data) {
	var d = new Date();
	var datestring = d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);

	var max_history = 20;
	save_data.history.push({"date":datestring, "roll":JSON.parse(JSON.stringify(data))}); // a strange way to deep clone the roll instead of copying the reference
	if (save_data.history.length > max_history) {
		save_data.history.splice(0, save_data.history.length-max_history);
	}
}

function DoRollFromData() {
	for (var i = 0; i < save_data.current_roll.length; i++) {
		save_data.current_roll[i].results = Roll(save_data.current_roll[i].roll_data);	
	}
	AddHistory(save_data.current_roll);
	app.form.storeFormData("save.json", save_data);
	console.log(save_data);
}

function Roll(rolldata) {
	result = JSON.parse('[]');
	var i;
	for (i = 0; i < rolldata.count; i++)
	{
		var roll = MyRand(rolldata.dice);
		
		// reroll 1 (but only once)
		if (roll == 1 && rolldata.min == true)
		{
			roll = MyRand(rolldata.dice);
		}
		
		finalroll = roll;
		while (rolldata.max == true && roll == rolldata.dice)
		{
			roll = Math.round((Math.random() * rolldata.dice)) + 1;
			finalroll += roll;
		}
		finalroll += rolldata.bonus_dice;
		result.push(finalroll);
	}
	return result;
}

function MyRand(max) {
	var roll = twister.genrand_max(max);
	return roll;
}

function GetKeptResults(data) {
	var dropped = [];
	var tmp = JSON.parse(JSON.stringify(data.results));
	var tmp = tmp.sort(function(a, b){return a - b});
	if (tmp.length > (data.roll_data.drop_high + data.roll_data.drop_low)) {
		if (data.roll_data.drop_low > 0) {
			dropped = dropped.concat(tmp.slice(0, data.roll_data.drop_low));
		}
		if (data.roll_data.drop_high > 0) {
			dropped = dropped.concat(tmp.slice(tmp.length-data.roll_data.drop_high, tmp.length));
		}
	}
	var final_array = JSON.parse(JSON.stringify(data.results));
	for (var i = 0; i < dropped.length; i++) {
		for (var j = 0; j < final_array.length; j++) {
			if (final_array[j] == dropped[i]) {
				final_array.splice(j,1);
				break;
			}
		}
	}
	
	if (save_data.settings.sort_results == true) {
		final_array = final_array.sort(function(a, b){return b - a});
	}
	
	return final_array;
}

function GetDroppedResults(data) {
	if (data.roll_data.drop_low == 0 && data.roll_data.drop_high == 0) {
		return [];
	}
	var dropped = [];
	var tmp = data.results.sort(function(a, b){return a - b});
	if (tmp.length > (data.roll_data.drop_high + data.roll_data.drop_low)) {
		if (data.roll_data.drop_low > 0) {
			dropped = dropped.concat(tmp.slice(0, data.roll_data.drop_low));
		}
		if (data.roll_data.drop_high > 0) {
			dropped = dropped.concat(tmp.slice(tmp.length-data.roll_data.drop_high, tmp.length));
		}
	}
	
	if (save_data.settings.sort_results == true) {
		dropped = dropped.sort(function(a, b){return b - a});
	}
	
	return dropped;
}

function GetSum() {
	var i = 0;
	var total = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var j = 0;
		var kept_results = GetKeptResults(inner);
		for (j = 0; j < kept_results.length; j++)
		{
			total += Math.max(1, kept_results[j]);
		}
		total += inner.roll_data.bonus_roll;
	}
	return total;
}

function GetCount() {
	var i = 0;
	var total = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		total += kept_results.length;
	}
	return total;
}

function GetAvg() {
	var i = 0;
	var count = 0;
	var sum = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		count += kept_results.length;
		var j = 0;
		for (j = 0; j < kept_results.length; j++)
		{
			sum += Math.max(1, kept_results[j]);
		}
	}
	return sum / count;
}

function GetMax() {
	var i = 0;
	var max = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		var j = 0;
		for (j = 0; j < kept_results.length; j++)
		{
			if (kept_results[j] > max)
			{
				max = kept_results[j];
			}
		}
	}
	return max;
}

function GetMin() {
	var i = 0;
	var min = -1;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		var j = 0;
		for (j = 0; j < kept_results.length; j++)
		{
			if (kept_results[j] < min || min == -1)
			{
				min = kept_results[j];
			}
		}
	}
	return min;
}

function GetCrit() {
	var i = 0;
	var totalcrit = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		var critthresh = inner.roll_data.dice;
		var j = 0;
		for (j = 0; j < kept_results.length; j++)
		{
			if (kept_results[j] - inner.roll_data.bonus_dice >= critthresh)
			{
				totalcrit += 1;
			}
		}
	}
	return totalcrit;
}

function GetMiss() {
	var i = 0;
	var totalmiss = 0;
	var totaldice = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		var j = 0;
		totaldice += kept_results.length;
		for (j = 0; j < kept_results.length; j++)
		{
			if (kept_results[j] - inner.roll_data.bonus_dice == 1)
			{
				totalmiss += 1;
			}
		}
	}
	return totalmiss + " (" + (totalmiss / totaldice * 100).toFixed(0) + "%)";
}

function GetThresholdCount(threshold) {
	var i = 0;
	var count = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		var j = 0;
		for (j = 0; j < kept_results.length; j++)
		{
			if (Math.max(1, kept_results[j]) >= threshold)
			{
				count += 1;
			}
		}
	}
	return count;
}

function UpdateSumText() {
	sumtext = GetLocalizedString("Sum");
	var i = 0;
	var hasbonus = false;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var bonus_roll = save_data.current_roll[i].roll_data.bonus_roll;
		if (bonus_roll != 0)
		{
			if (hasbonus)
			{
				sumtext += "/";
			}
			else
			{
				sumtext += " ";
			}
			if (bonus_roll > 0)
			{
				sumtext += "+";
			}
			sumtext += bonus_roll;
			hasbonus = true;
		}
	}
	
	$$("#stats-sum-title").text(sumtext);
}

function UpdateDiceTitle() {
	if (save_data.current_roll[0].roll_data.dice != undefined) {
		var title = MatchWithPreset(save_data.current_roll);
		if (title == null) {
			title = GetRollGeneratedName(save_data.current_roll);
		}
		$$("#title-results").text(title);
	}
}

function GetRollGeneratedName(roll) {
	var title = "";
	if (roll.length > 1) {
		title = GetLocalizedString("Multiple Roll");
	}
	else {
		var dicetype = roll[0].roll_data.dice;
		var dicecount = roll[0].roll_data.count;
		var bonus_dice = roll[0].roll_data.bonus_dice;
		var bonus_roll = roll[0].roll_data.bonus_roll;
		var reroll_max = roll[0].roll_data.max;
		var reroll_one = roll[0].roll_data.min;
		
		title += dicecount + "D"
		if (bonus_dice != 0) {
			title += "(";
		}
		title += dicetype;
		if (bonus_dice != 0) {
			if (bonus_dice > 0) {
				title += "+";
			}
			title += bonus_dice + ")";
		}
		if (bonus_roll != 0) {
			title += " ";
			if (bonus_roll > 0) {
				title += "+ ";
			}
			title += bonus_roll;
		}
		if (reroll_max == true || reroll_one == true) {
			title += " Reroll ";
			if (reroll_max == true) {
				title += dicetype;
			}
			if (reroll_max == true && reroll_one) {
				title += "/";
			}
			if (reroll_one == true) {
				title += "1";
			}
		}
	}
	
	return title;
}

function UpdateOptionsTitle() {
	var title = "";
	
	var dicetype = save_data.current_roll[0].roll_data.dice;
	var dicecount = save_data.current_roll[0].roll_data.count;
	
	title += dicecount + "D" + dicetype;	
	
	title += GetLocalizedString("'s Options");
	$$("#title-options").text(title);
}

function UpdateDiceList() {
	var content = "";
	$$("#dice-list").text(content);
	var i = 0;
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var kept_results = GetKeptResults(inner);
		var j = 0;
		for (j = 0; j < kept_results.length; j++)
		{
			var dice = inner.roll_data.dice;
			var result = Math.max(1, kept_results[j]);
			content += "<div class='dice-icon " + GetIconClassForDice(dice) + "'>" + result + "</div>"
		}
	}
	for (i = 0; i < save_data.current_roll.length; i++)
	{
		var inner = save_data.current_roll[i];
		var dropped_results = GetDroppedResults(inner);
		var j = 0;
		for (j = 0; j < dropped_results.length; j++)
		{
			var dice = inner.roll_data.dice;
			var result = Math.max(1, dropped_results[j]);
			content += "<div class='dice-icon strikethrough " + GetIconClassForDice(dice) + "'>" + result + "</div>"
		}
	}
	
	$$("#dice-list").append(content); // text(content) will escape html tags, use append()
}

function GetIconClassForDice(dice) {
	content = "";
	if (dice == 2)
	{
		content = "d2-icon";
	}
	else if (dice == 4)
	{
		content = "d4-icon";
	}
	else if (dice == 6)
	{
		content = "d6-icon";
	}
	else if (dice == 8)
	{
		content = "d8-icon";
	}
	else if (dice == 10)
	{
		content = "d10-icon";
	}
	else if (dice == 12)
	{
		content = "d12-icon";
	}
	else if (dice == 20)
	{
		content = "d20-icon";
	}
	else if (dice == 100)
	{
		content = "d100-icon";
	}
	else
	{
		content = "";
	}
	
	return content;
}

function UpdateTooltips() {
	var tooltips = $$(".icon-tooltip");
	for (var i = 0; i < tooltips.length; i++) {
		if (save_data.settings.show_tooltips == true) {
			$$(tooltips[i]).show();
		}
		else {
			$$(tooltips[i]).hide();
		}
	}
}

function UpdateTheme() {
	if (save_data.settings.dark_theme == true) {
		$$("body").addClass("theme-dark");
	}
	else {
		$$("body").removeClass("theme-dark");
	}
}

var initial_data = JSON.parse('{"version":12, "current_roll":[{"roll_data":{}, "results":[]}], "history":[], "presets":[], "settings":{"first_page":"dicetype", "show_roll_options":true, "show_tooltips":true, "sort_results":false, "language":"", "dark_theme":false, "show_ads":true, "result_page":"stats"}}');

save_data = app.form.getFormData("save.json");
// APP HAS BEEN RELEASE. It is innacceptable to delete profile now !
if (save_data == null || save_data.version == undefined || save_data.version < 9)
{
	save_data = initial_data;
	app.form.storeFormData("save.json", initial_data);
}
else
{
	// porting profile to v10
	if (save_data.version == 9) {
		for (var i = 0; i < save_data.presets.length; i++) {
			for (var j = 0; j < save_data.presets[i].roll_data.length; j++) {
				save_data.presets[i].roll_data[j].results = [];
			}
		}
	}
	if (save_data.version < 12) {
		save_data.settings.result_page = "stats"
	}
	if (save_data.version < initial_data.version) {
		save_data.version = initial_data.version;
		app.form.storeFormData("save.json", save_data);
		console.log(save_data);
	}
	save_data.current_roll = initial_data.current_roll;
}


if ($$("#preset-list").length != 0) {
	UpdatePresetList();
}
if ($$("#preset-sortable-list").length != 0) {
	UpdateSortablePresetList();
}

function UpdatePresetList() {
	var routepath = mainView.router.currentRoute.path;
	var isFirst = false;
	if (routepath == "/first/" || routepath == undefined) {
		isFirst = true;
	}
	var content = "";
	$$("#preset-list").text(content);
	console.log("preset length = " + save_data.presets.length + ", isFirst = " + routepath);
	if (save_data.presets.length <= 0 || !isFirst) {
		$$(".preset-accordion").hide();
	}
	else {
		$$(".preset-accordion").show();
	}
	for (var i = 0; i < save_data.presets.length; i++)
	{
		var presetname = save_data.presets[i].name;
		content += '<li>' +
		'	<a href="#" class="item-link item-content roll-preset">' +
		'		<div class="item-inner roll-preset">' +
		'			<div class="item-title roll-preset">' + presetname + '</div>' +
		'		</div>' +
		'	</a>' +
		'</li>';
	}
	$$("#preset-list").append(content); // text(content) will escape html tags, use append()
}
$$(document).off("click", "a", ProcessClick).on("click", "a", ProcessClick);

function UpdateSortablePresetList() {
	var content = "";
	$$("#preset-sortable-list").text(content);
	if (save_data.presets.length <= 0) {
		content = '<div class="block-title">' + GetLocalizedString("You have no Preset") + '</div>';
		$$("#preset-sortable-list").append(content); // text(content) will escape html tags, use append()
		return;
	}
	for (var i = 0; i < save_data.presets.length; i++)
	{
		var presetname = save_data.presets[i].name;
		content += '<li>' +
		'	<div class="item-content">' +
		'		<a href="#" class="item-media open-confirm">' +
		'			<i class="icon f7-icons color-red ios-only open-confirm">close_round_fill</i>' +
		'			<i class="icon material-icons color-red md-only open-confirm">remove_circle</i>' +
		'		</a>' +
		'		<a href="/presetmanagedetail/?presetname=' + presetname + '" class="link item-inner">' +
		'			<div class="item-title">' + presetname + '</div>' +
		'		</a>' +
		'	</div>' +
		'	<div class="sortable-handler"></div>' +
		'</li>';
	}
	$$("#preset-sortable-list").append(content); // text(content) will escape html tags, use append()
}

function UpdateHistoryList() {
	var content = "";
	var current_date = "";
	var first_content = true;
	$$("#history-list").text(content);
	
	if (save_data.history.length <= 0) {
		content = '<div class="block-title">' + GetLocalizedString("History is Empty") + '</div>';
		$$("#history-list").append(content); // text(content) will escape html tags, use append()
		return;
	}
	
	for (var i = save_data.history.length-1; i >= 0; i--) {
		var data = save_data.history[i];
		if (current_date == "" || current_date != data.date) {
			current_date = data.date;
			// update content header
			if (first_content == false) {
				content += '</ul></div>';
			}
			first_content = false;
			content += '<div class="block-title">' + current_date + '</div>';
			content += '<div class="list"><ul>';
		}
		var dice = data.roll[0].roll_data.dice;
		var max = GetMax()
		var title = MatchWithPreset(data.roll);
		if (title == null) {
			title = GetRollGeneratedName(data.roll);
		}
		content +=  '<li>' +
					'	<div class="item-content">' +
					'		<div class="item-media">' +
					'			<div class="dice-icon-history ' + GetIconClassForDice(dice) + '">' + dice + '</div>' +
					'		</div>' +
					'		<a href="#" class="item-inner dohistory">' +
					'			<div class="item-title dohistory">' + title + 
					'			<input id="history-index" type="hidden" value="' + i + '"/></div>' +
					'		</a>' +
					'		<a href="#" class="item-media right doerasehistory">' +
					'			<i class="icon f7-icons color-red ios-only doerasehistory">close_round_fill</i>' +
					'			<i class="icon material-icons color-red md-only doerasehistory">cancel</i>' +
					'		</a>' +
					'	</div>' +
					'</li>';
	}
	content += '<div class="list"><ul>';
	$$("#history-list").append(content); // text(content) will escape html tags, use append()
}

function PresetSortEvent(ev) {
	var ifrom = ev.detail.from;
	var ito = ev.detail.to;
	console.log("Preset SORT event : " + ifrom + "(" + save_data.presets[ifrom].name + ")->" + ito + "(" + save_data.presets[ito].name + ")");
	var tmp = save_data.presets[ifrom];
	var tmp2 = save_data.presets[ifrom];
	var direction = 1;
	if (ifrom < ito) {
		direction = -1;
	}
	for (var i = ito; i != ifrom + direction; i += direction) {
		tmp2 = save_data.presets[i];
		tmp = save_data.presets[i] = tmp;
		tmp = tmp2;
	}
	//save_data.presets[ifrom] = save_data.presets[ito];
	//save_data.presets[ito] = tmp;
	app.form.storeFormData("save.json", save_data);
	if ($$("#preset-list").length != 0) {
		UpdatePresetList();
		UpdateAndroidShortcuts();
		$$(document).off("click", "a", ProcessClick).on("click", "a", ProcessClick);
		$$("#preset-sortable-list").off("sortable:sort", PresetSortEvent);
		$$("#preset-sortable-list").on("sortable:sort", PresetSortEvent);
	}
}

function UpdateNav(page) {	
	// IOS
	var navback = $$(".navbar-next").find(".back-nav");
	var navhome = $$(".navbar-next").find(".home-nav");
	var navmore = $$(".navbar-next").find(".more-nav");
	if (navback.length == 0 && navhome.length == 0 && navmore.length == 0) {
		var navback = $$(".navbar-previous").find(".back-nav");
		var navhome = $$(".navbar-previous").find(".home-nav");
		var navmore = $$(".navbar-previous").find(".more-nav");
	}
	// Android
	if (navback.length == 0 && navhome.length == 0 && navmore.length == 0) {
		navback = page.$el.find(".back-nav");
		navhome = page.$el.find(".home-nav");
		navmore = page.$el.find(".more-nav");
	}
	
	var routepath = page.route.path;
	if (routepath == "/first/" || routepath == undefined) {
		navback.remove();
		navmore.remove();
		page.$el.addClass("no-swipeback");
	}
	else
	{
		navhome.remove();
	}
}

function callback_save_preset(name) {
	var ok = true;
	for (var i = 0; i < save_data.presets.length; i++) {
		var existingpreset = save_data.presets[i].name;
		if (existingpreset == name) {
			// confirm dialog run async so I need to stop process here until dialog complete
			ok = false;
			app.dialog.confirm(existingpreset, GetLocalizedString('Overwrite ?'), function () {
				var tmp = JSON.parse(JSON.stringify(save_data.current_roll));
				for (var j = 0; j < tmp.length; j++) {
					tmp[j].results = []; // clean the results so we do not save them as preset.
				}
				save_data.presets[i].roll_data = tmp;
				app.form.storeFormData("save.json", save_data);
				UpdateAndroidShortcuts();
			}, function() {
				ok = false;
			});
			break;
		}
	}
	if (ok == true) {
		var tmp = JSON.parse(JSON.stringify(save_data.current_roll));
		for (var j = 0; j < tmp.length; j++) {
			tmp[j].results = []; // clean the results so we do not save them as preset.
		}
		save_data.presets.push({"name":name, "roll_data":tmp});
		app.form.storeFormData("save.json", save_data);
		UpdateAndroidShortcuts();
	}
}

function DoSavePresetEdit() {
	var root_preset_detail_name = $$("input[name='preset-detail-name']");
	var root_preset_detail_name_orig = $$("input[name='preset_detail-name-orig']");
	var new_preset_data = {}
	preset_index = -1;
	for (var i = 0; i < save_data.presets.length; i++) {
		if (save_data.presets[i].name == root_preset_detail_name_orig.val()) {
			preset_index = i;
			break;
		}
	}
	if (preset_index < 0) {
		return;
	}
	
	new_preset_data["name"] = root_preset_detail_name.val();
	new_preset_data["roll_data"] = [];
	
	var dice_throws = $$(".throw_data");
	for (var i = 0; i < dice_throws.length; i++) {
		// these two method crash for some reason
		//$(element).is(":visible");
		//$(element).is(":hidden");
		var elem = $$(dice_throws[i]);
		if (dice_throws[i].style.display == "none") {
			continue;
		}
		
		var cur_data = {}
		cur_data["results"] = [];
		cur_data["roll_data"] = {};
		
		var child_throw_id = elem.find(".throw-id");
		var child_detail_dice_face = elem.find("input[name='preset-detail-dice-face']");
		var child_detail_dice_count = elem.find("input[name='preset-detail-dice-count']");
		var child_preset_dice_reroll_max = elem.find("input[name='preset-dice-reroll-max']");
		var child_preset_dice_reroll_min = elem.find("input[name='preset-dice-reroll-min']");
		var child_preset_bonus_dice_slider = elem.find(".preset-bonus-dice-slider");
		var child_preset_dice_bonus = elem.find("input[name='preset-dice-bonus']");
		var child_preset_bonus_roll_slider = elem.find(".preset-bonus-roll-slider");
		var child_preset_roll_bonus = elem.find("input[name='preset-roll-bonus']");
		var child_preset_drophigh_slider = elem.find(".preset-drophigh-slider");
		var child_preset_drophigh = elem.find("input[name='preset-drophigh']");
		var child_preset_droplow_slider = elem.find(".preset-droplow-slider");
		var child_preset_droplow = elem.find("input[name='preset-droplow']");
		
		cur_data["roll_data"]["bonus_dice"] = parseInt(child_preset_dice_bonus.val());
		cur_data["roll_data"]["bonus_roll"] = parseInt(child_preset_roll_bonus.val());
		cur_data["roll_data"]["count"] = child_detail_dice_count.val();
		cur_data["roll_data"]["dice"] = child_detail_dice_face.val();
		cur_data["roll_data"]["drop_high"] = parseInt(child_preset_drophigh.val());
		cur_data["roll_data"]["drop_low"] = parseInt(child_preset_droplow.val());
		cur_data["roll_data"]["max"] = $$(child_preset_dice_reroll_max).is(':checked');
		cur_data["roll_data"]["min"] = $$(child_preset_dice_reroll_min).is(':checked');
		new_preset_data["roll_data"].push(JSON.parse(JSON.stringify(cur_data)));
	}
	save_data.presets[preset_index] = JSON.parse(JSON.stringify(new_preset_data));
	app.form.storeFormData("save.json", save_data);
}

function InitPresetDetail(preset_name) {
	var preset_data;
	var copy = $$(".throw_data")[0];
	var root = $$(".throw_data")[0];
	
	for (var i = 0; i < save_data.presets.length; i++) {
		if (save_data.presets[i].name == preset_name) {
			preset_data = save_data.presets[i];
			break;
		}
	}
	
	var root_throw_id = $$(".throw-id");
	var root_preset_detail_name = $$("input[name='preset-detail-name']");
	var root_preset_detail_name_orig = $$("input[name='preset_detail-name-orig']");
	var root_preset_max_title = $$(".preset-max-title");
	var root_detail_dice_face = $$("input[name='preset-detail-dice-face']");
	var root_detail_dice_count = $$("input[name='preset-detail-dice-count']");
	var root_preset_dice_reroll_max = $$("input[name='preset-dice-reroll-max']");
	var root_preset_dice_reroll_min = $$("input[name='preset-dice-reroll-min']");
	var root_preset_bonus_dice_slider = $$(".preset-bonus-dice-slider");
	var root_preset_dice_bonus = $$("input[name='preset-dice-bonus']");
	var root_preset_bonus_roll_slider = $$(".preset-bonus-roll-slider");
	var root_preset_roll_bonus = $$("input[name='preset-roll-bonus']");
	var root_preset_drophigh_slider = $$(".preset-drophigh-slider");
	var root_preset_drophigh = $$("input[name='preset-drophigh']");
	var root_preset_droplow_slider = $$(".preset-droplow-slider");
	var root_preset_droplow = $$("input[name='preset-droplow']");
	
	root_preset_detail_name.val(preset_name);
	root_preset_detail_name_orig.val(preset_name);
	
	var child_throw_id = $$(".throw-id");
	var child_preset_max_title = $$(".preset-max-title");
	var child_detail_dice_face = $$("input[name='preset-detail-dice-face']");
	var child_detail_dice_count = $$("input[name='preset-detail-dice-count']");
	var child_preset_dice_reroll_max = $$("input[name='preset-dice-reroll-max']");
	var child_preset_dice_reroll_min = $$("input[name='preset-dice-reroll-min']");
	var child_preset_bonus_dice_slider = $$(".preset-bonus-dice-slider");
	var child_preset_dice_bonus = $$("input[name='preset-dice-bonus']");
	var child_preset_bonus_roll_slider = $$(".preset-bonus-roll-slider");
	var child_preset_roll_bonus = $$("input[name='preset-roll-bonus']");
	var child_preset_drophigh_slider = $$(".preset-drophigh-slider");
	var child_preset_drophigh = $$("input[name='preset-drophigh']");
	var child_preset_droplow_slider = $$(".preset-droplow-slider");
	var child_preset_droplow = $$("input[name='preset-droplow']");
	
	for (var i = 0; i < preset_data.roll_data.length; i++) {
		copy = root.cloneNode(true);
		
		child_throw_id = $$(copy).find(".throw-id");
		child_throw_id.text(GetLocalizedString("Throw ") + i);
		
		root.parentNode.insertBefore(copy, null);
		
		set_all_preset_detail(copy, preset_data.roll_data[i]);
	}
	
	$$(root).hide();
}

function set_all_preset_detail(copy, roll_data) {
	var child_preset_max_title = $$(copy).find(".preset-max-title");
	var child_detail_dice_face = $$(copy).find("input[name='preset-detail-dice-face']");
	var child_detail_dice_count = $$(copy).find("input[name='preset-detail-dice-count']");
	var child_preset_dice_reroll_max = $$(copy).find("input[name='preset-dice-reroll-max']");
	var child_preset_dice_reroll_min = $$(copy).find("input[name='preset-dice-reroll-min']");
	var child_preset_bonus_dice_slider = $$(copy).find(".preset-bonus-dice-slider");
	var child_preset_dice_bonus = $$(copy).find("input[name='preset-dice-bonus']");
	var child_preset_bonus_roll_slider = $$(copy).find(".preset-bonus-roll-slider");
	var child_preset_roll_bonus = $$(copy).find("input[name='preset-roll-bonus']");
	var child_drop_root = $$(copy).find(".preset-drop-root");
	var child_preset_drophigh_slider = $$(copy).find(".preset-drophigh-slider");
	var child_preset_drophigh = $$(copy).find("input[name='preset-drophigh']");
	var child_preset_droplow_slider = $$(copy).find(".preset-droplow-slider");
	var child_preset_droplow = $$(copy).find("input[name='preset-droplow']");
	
	app.range.create({"el":child_preset_bonus_dice_slider, "inputEl":child_preset_dice_bonus, "label":true, "min":-10, "max":10, "value":0});
	app.range.create({"el":child_preset_bonus_roll_slider, "inputEl":child_preset_roll_bonus, "label":true, "min":-10, "max":10, "value":0});
	app.range.create({"el":child_preset_drophigh_slider, "inputEl":child_preset_drophigh, "label":true, "min":0, "max":10, "value":0});
	app.range.create({"el":child_preset_droplow_slider, "inputEl":child_preset_droplow, "label":true, "min":0, "max":10, "value":0});
	
	function dice_face_change(ev) {
		child_preset_max_title.text(GetLocalizedString("Reroll ") + ev.target.value + GetLocalizedString("s"));
	}
	child_detail_dice_face.off("change", dice_face_change).on("change", dice_face_change);
	child_detail_dice_face.val(roll_data.roll_data.dice);
	function dice_count_change(ev) {
		var count = parseInt(child_detail_dice_count.val());
		if (count <= 1) {
			$$(child_drop_root).hide();
		}
		else {
			$$(child_drop_root).show();
		}
		$$(child_preset_drophigh)[0].max = count;
		$$(child_preset_droplow)[0].max = count;
		app.range.get(child_preset_drophigh_slider).max = count;
		app.range.get(child_preset_droplow_slider).max = count;
	}
	child_detail_dice_count.off("change", dice_count_change).on("change", dice_count_change);
	child_detail_dice_count.val(roll_data.roll_data.count);
	dice_count_change(null);
	
	child_preset_max_title.text(GetLocalizedString("Reroll ") + roll_data.roll_data.dice + GetLocalizedString("s"));
	if (roll_data.roll_data.max == true) {
		 child_preset_dice_reroll_max.attr('checked',true);
	}
	else {
		child_preset_dice_reroll_max.removeAttr('checked');
	}
	
	if (roll_data.roll_data.min == true) {
		 child_preset_dice_reroll_min.attr('checked',true);
	}
	else {
		child_preset_dice_reroll_min.removeAttr('checked');
	}
	
	function preset_dice_range_change(event, range) {
		bonus_dice_set(parseInt(range.value), copy);
	}
	child_preset_bonus_dice_slider.off('range:change', preset_dice_range_change).on('range:change', preset_dice_range_change);
	app.range.setValue(child_preset_dice_bonus, roll_data.roll_data.bonus_dice);
	child_preset_dice_bonus[0].value = roll_data.roll_data.bonus_dice;
	bonus_dice_set(roll_data.roll_data.bonus_dice, copy);
	
	function preset_roll_range_change(event, range) {
		bonus_roll_set(parseInt(range.value), copy);
	}
	child_preset_bonus_roll_slider.off('range:change', preset_roll_range_change).on('range:change', preset_roll_range_change);
	app.range.setValue(child_preset_roll_bonus, roll_data.roll_data.bonus_roll);
	child_preset_roll_bonus[0].value = roll_data.roll_data.bonus_roll;
	bonus_roll_set(roll_data.roll_data.bonus_roll, copy);
	
	function preset_drophigh_range_change(event, range) {
		drop_high_set(parseInt(range.value), copy);
	}
	child_preset_drophigh_slider.off('range:change', preset_drophigh_range_change).on('range:change', preset_drophigh_range_change);
	app.range.setValue(child_preset_drophigh, roll_data.roll_data.drop_high);
	child_preset_drophigh[0].value = roll_data.roll_data.drop_high;
	drop_high_set(roll_data.roll_data.drop_high, copy);
	
	function preset_droplow_range_change(event, range) {
		drop_low_set(parseInt(range.value), copy);
	}
	child_preset_droplow_slider.off('range:change', preset_droplow_range_change).on('range:change', preset_droplow_range_change);
	app.range.setValue(child_preset_droplow, roll_data.roll_data.drop_low);
	child_preset_droplow[0].value = roll_data.roll_data.drop_low;
	drop_low_set(roll_data.roll_data.drop_low, copy);
}

function bonus_dice_set(val, base) {
	var textval = "";
	if (val >= 0) {
		textval += "+";
	}
	textval += val + GetLocalizedString(" To Each Roll");
	$$(base).find(".preset-bonus-dice-title").text(textval);
}

function bonus_roll_set(val, base) {
	var textval = "";
	if (val >= 0) {
		textval += "+";
	}
	textval += val + GetLocalizedString(" To Final Sum");
	$$(base).find(".preset-bonus-roll-title").text(textval);
}

function drop_high_set(val, base) {
	var textval = "";
	textval = GetLocalizedString("Drop ") + val + GetLocalizedString(" Highest Roll");
	$$(base).find(".preset-drophigh-label").text(textval);
}
	
function drop_low_set(val, base) {
	var textval = "";
	textval = GetLocalizedString("Drop ") + val + GetLocalizedString(" Lowest Roll");
	$$(base).find(".preset-droplow-label").text(textval);
}

app.router.navigate("/first/", {"animate":false, "pushState":false, "history":false});
UpdateTooltips();
UpdateTheme();
InitLanguage(save_data.settings.language);

$$(document).on('page:beforein', function (e, page) {
	UpdateNav(page);
});

// sometimes when clicking the back button page:init is not triggered which keeps the preset page hidden
$$(document).on("page:reinit", function (page){
	UpdatePresetList();
});

$$(document).on('page:init', function (e, page) {
	if (page.$el.attr("data-name") == "dicestats" && (page.$el.hasClass("page-next") || isFromIntent == true) && save_data.current_roll[0].results.length <= 0) {
		DoRollFromData();
	}
	else if (
		!(page.$el.attr("data-name") == "dicestats" && (page.$el.hasClass("page-next") || isFromIntent == true)) && 
		save_data.current_roll[0].results != undefined && save_data.current_roll[0].results.length > 0) {
		for (var i = 0; i < save_data.current_roll.length; i++) {
			save_data.current_roll = JSON.parse('[{"roll_data":{}, "results":[]}]');
		}
	}
	isFromIntent = false;
	
	if (mainView.router.currentRoute.url.includes("first")) {
		mainView.router.clearPreviousHistory();
	}
	
	function open_promp_click() {
		app.dialog.create({
			title: GetLocalizedString('Preset Name'),
			text: '',
			content: '<div class="dialog-input-field item-input"><div class="item-input-wrap"><input type="text" class="dialog-input input-focused input-with-value" placeholder="Unique Name" value="' + GetRollGeneratedName(save_data.current_roll) + '" style="color:#757575;"><span class="input-clear-button input-clear-button-dialog"></span></div></div>',
			buttons: [
				{
					text: app.params.dialog.buttonCancel,
					keyCodes: [27],
				},
				{
					text: app.params.dialog.buttonOk,
					bold: true,
					keyCodes: [13],
				},
			],
			onClick: function(dialog, index) {
				const inputValue = dialog.$el.find('.dialog-input').val();
				//if (index === 0 && callbackCancel) callbackCancel(inputValue);
				if (index === 1) callback_save_preset(inputValue);
			},
			destroyOnClose:true,
		}).open()
	}
	$$('.open-prompt').off('click', open_promp_click).on('click', open_promp_click);
	
	// Update to html data must be done BEFORE registering to events or they won't work
	if ($$("#preset-list").length != 0) {
		UpdatePresetList();
	}
	if ($$("#preset-sortable-list").length != 0) {
		UpdateSortablePresetList();
	}
	if ($$("#history-list").length != 0) {
		UpdateHistoryList();
	}
	
	$$("#preset-sortable-list").off("sortable:sort", PresetSortEvent).on("sortable:sort", PresetSortEvent);
	
	function first_page_change(ev){
		save_data.settings.first_page = ev.target.value;
		app.form.storeFormData("save.json", save_data);
	}
	$$("input[name='first-page']").off("change", first_page_change).on("change", first_page_change );
	
	function result_page_change(ev){
		save_data.settings.result_page = ev.target.value;
		app.form.storeFormData("save.json", save_data);
	}
	$$("input[name='result-page']").off("change", result_page_change).on("change", result_page_change );
	
	function option_change(ev) {
		var show_page = $$(ev.target).is(':checked');
		save_data.settings.show_roll_options = show_page;
		app.form.storeFormData("save.json", save_data);
	}
	$$("input[name='option-option-page']").off("change", option_change).on("change", option_change);
	function option_tooltips(ev) {
		var show_tooltips = $$(ev.target).is(':checked');
		save_data.settings.show_tooltips = show_tooltips;
		app.form.storeFormData("save.json", save_data);
		UpdateTooltips();
	}
	$$("input[name='option-tooltips']").off("change", option_tooltips).on("change", option_tooltips);
	function option_theme(ev) {
		var dark_theme = $$(ev.target).is(':checked');
		save_data.settings.dark_theme = dark_theme;
		app.form.storeFormData("save.json", save_data);
		UpdateTheme();
	}
	$$("input[name='option-theme']").off("change", option_theme).on("change", option_theme);
	function option_sort(ev) {
		var sort_res = $$(ev.target).is(':checked');
		save_data.settings.sort_results = sort_res;
		app.form.storeFormData("save.json", save_data);
	}
	$$("input[name='option-sort']").off("change", option_sort).on("change", option_sort);
	
	if ($$("input[name='dice-reroll-max']").length != 0) {
		var input = $$("input[name='dice-reroll-max']");
		if (save_data.history.length > 0) {
			 var last_roll = save_data.history[save_data.history.length-1].roll;
			 if (last_roll[last_roll.length-1].roll_data.max == true) {
				 input.attr('checked',true);
			 }
			 else {
				 input.removeAttr('checked');
			 }
		}
	}
	if ($$("input[name='dice-reroll-min']").length != 0) {
		var input = $$("input[name='dice-reroll-min']");
		if (save_data.history.length > 0) {
			 var last_roll = save_data.history[save_data.history.length-1].roll;
			 if (last_roll[last_roll.length-1].roll_data.min == true) {
				 input.attr('checked',true);
			 }
			 else {
				 input.removeAttr('checked');
			 }
		}
	}
	function disable_swipe(event) {
		app.swiper.get($$('.tabs-swipeable-wrap')).allowTouchMove = false;
	}
    $$('#threshold-slider').off('touchstart', disable_swipe).on('touchstart', disable_swipe);
	function enable_swipe(event) {
		app.swiper.get($$('.tabs-swipeable-wrap')).allowTouchMove = true;
	}
	$$('#threshold-slider').off('touchend', enable_swipe).on('touchend', enable_swipe);
	function threshold_range_change(event, range) {
		$$("#stats-threshold-val").text(GetLocalizedString("Above Threshold of ") + range.value);
		$$("#stats-threshold-count").text(GetThresholdCount(range.value));
	}
	$$('#threshold-slider').off('range:change', threshold_range_change).on('range:change', threshold_range_change);
	function dice_range_change(event, range) {
		var textval = "";
		if (parseInt(range.value) >= 0) {
			textval += "+";
		}
		textval += range.value + GetLocalizedString(" To Each Roll");
		$$("#dice-bonus-label").text(textval);
	}
	$$('#dice-bonus-slider').off('range:change', dice_range_change).on('range:change', dice_range_change);
	function roll_range_change(event, range) {
		var textval = "";
		if (parseInt(range.value) >= 0) {
			textval += "+";
		}
		textval += range.value + GetLocalizedString(" To Final Sum");
		$$("#roll-bonus-label").text(textval);
	}
	$$('#roll-bonus-slider').off('range:change', roll_range_change).on('range:change', roll_range_change);
	
	if ($$('#roll-drophigh-slider').length != 0) {
		var dice_count = save_data.current_roll[save_data.current_roll.length-1].roll_data.count;
		if (dice_count == 1) {
			$$('.drop-li').hide();
		}
		else {
			$$('.drop-li').show();
		}
		$$("input[name='drophigh']")[0].max = dice_count;
		$$("input[name='droplow']")[0].max = dice_count;
	}
	function drop_high_range_change(event, range) {
		var textval = "";
		textval = GetLocalizedString("Drop ") + range.value + GetLocalizedString(" Highest Roll");
		$$("#roll-drophigh-label").text(textval);
	}
	$$('#roll-drophigh-slider').off('range:change', drop_high_range_change).on('range:change', drop_high_range_change);
	function drop_low_range_change(event, range) {
		var textval = "";
		textval = GetLocalizedString("Drop ") + range.value + GetLocalizedString(" Lowest Roll");
		$$("#roll-droplow-label").text(textval);
	}
	$$('#roll-droplow-slider').off('range:change', drop_low_range_change).on('range:change', drop_low_range_change);
	
	function count_ajax() {
		var val = $$("input[name='dice-count-input']").val();
		if (val > 0)
		{
			save_data.current_roll[save_data.current_roll.length-1].roll_data.count = parseInt(val);
			$$("input[name='dice-count-input']").blur();
			app.router.navigate("/dicecountnext/");
		}
		else
		{
			console.log("error, NAN");
		}
	}
	$$("#dice-count").off("formajax:success", count_ajax).on("formajax:success", count_ajax);
	function side_ajax() {
		var val = $$("input[name='dice-side-input']").val();
		if (val > 0)
		{
			save_data.current_roll[save_data.current_roll.length-1].roll_data.dice = parseInt(val);
			$$("input[name='dice-side-input']").blur();
			app.router.navigate("/dicetypenext/");
		}
		else
		{
			console.log("error, NAN");
		}
	}
	$$("#dice-side").off("formajax:success", side_ajax).on("formajax:success", side_ajax);
	$$(document).off("click", "a", ProcessClick).on("click", "a", ProcessClick);
	
	if ($$("#title-options").length != 0) {
		UpdateOptionsTitle();
	}
	
	if ($$("#tab-1").length != 0 && isRerollFromDetail) {
		isRerollFromDetail = false;
		app.tab.show($$("#tab-2"), false);
	}
	
	if ($$("#tab-1").length != 0 && save_data.current_roll.length == 1 && save_data.current_roll[0].results.length == 1) {
		app.tab.show($$("#tab-2"), false);
	}
	else if (save_data.settings.result_page == "detail") {
		app.tab.show($$("#tab-2"), false);
	}
	
	if ($$("#stats-count").length != 0)
	{
		$$("#stats-count").text(GetCount());
		$$("#stats-sum").text(Math.max(1, GetSum()));
		UpdateSumText();
		$$("#stats-avg").text(GetAvg().toFixed(2));
		var max = Math.max(1, GetMax());
		$$("#stats-high").text(max);
		$$("#stats-low").text(Math.max(1, GetMin()));
		$$("#stats-crit").text(GetCrit());
		$$("#stats-miss").text(GetMiss());
		app.range.setValue($$("#stats-threshold-range"), (parseInt(max/2)));
		$$("#stats-threshold-range")[0].value = parseInt(max/2);
		$$("#stats-threshold-val").text(GetLocalizedString("Above Threshold of ") + $$("#stats-threshold-range")[0].value);
		$$("#stats-threshold-range")[0].max = max;
		$$("#stats-threshold-count").text(GetThresholdCount($$("#stats-threshold-range")[0].value));
		
		UpdateDiceList();
		UpdateDiceTitle();
	}
	
	if ($$(".reroll-max-title").length != 0) {
		$$(".reroll-max-title").text(GetLocalizedString("Reroll ") + save_data.current_roll[save_data.current_roll.length-1].roll_data.dice + GetLocalizedString("s"));
	}
	
	if ($$("input[name='preset-detail-name']").length != 0) {
		var preset_name = e.detail.route.query.presetname;
		if (preset_name != undefined) {
			InitPresetDetail(preset_name);
		}
	}
	
	
	var first_page_settings = $$("input[name='first-page']");
	if (first_page_settings.length !=0) {
		for (var i = 0; i < first_page_settings.length; i++) {
			var input = $$(first_page_settings[i]);
			if (input.attr("value") == save_data.settings.first_page) {
				input.attr('checked',true);
			}
			else
			{
				input.removeAttr('checked');
			}
		}
		var result_page_settings = $$("input[name='result-page']");
		for (var i = 0; i < result_page_settings.length; i++) {
			var input = $$(result_page_settings[i]);
			if (input.attr("value") == save_data.settings.result_page) {
				input.attr('checked',true);
			}
			else
			{
				input.removeAttr('checked');
			}
		}
		
		var skip_options = $$("input[name='option-option-page']");
		if (save_data.settings.show_roll_options == true) {
			skip_options.attr('checked', true);
		}
		else {
			skip_options.removeAttr('checked');
		}
		
		var tooltip_options = $$("input[name='option-tooltips']");
		if (save_data.settings.show_tooltips == true) {
			tooltip_options.attr('checked', true);
		}
		else {
			tooltip_options.removeAttr('checked');
		}
		
		var theme_options = $$("input[name='option-theme']");
		if (save_data.settings.dark_theme == true) {
			theme_options.attr('checked', true);
		}
		else {
			theme_options.removeAttr('checked');
		}
		
		var sort_option = $$("input[name='option-sort']");
		if (save_data.settings.sort_results == true) {
			sort_option.attr('checked', true);
		}
		else {
			sort_option.removeAttr('checked');
		}
	}
	UpdateTooltips();
});

//////////////////////////////////////////////////////////////////////////////
// CORDOVA SPECIFIC METHODS (need to include cordova.js)
//////////////////////////////////////////////////////////////////////////////

function UpdateAndroidShortcuts() {
	// if cordova is not installed, return
	if (window.plugins == undefined) {
		return;
	}
	
	window.plugins.Shortcuts.supportsDynamic(function(supported) { 
		if (supported) {
			DoUpdateAndroidShortcuts();
		}
	}, function(error) {});
}

function DoUpdateAndroidShortcuts() {
	var shortcuts = []
	for (var i = 0; i < save_data.presets.length; i++) {
		// android dynamic shortcut only support 5 max
		if (i > 5) {
			break;
		}
		var preset_data = save_data.presets[i];
		var shortcut = {
			id: preset_data.name,
			shortLabel:  preset_data.name,
			longLabel: preset_data.name,
			//iconBitmap: '<Bitmap for the shortcut icon, base64 encoded>',
			intent: {
				action: 'android.intent.action.RUN',
				categories: [
					'android.intent.category.TEST', // Built-in Android category
					'PRESETS' // Custom categories are also supported
				],
				flags: 67108864, // FLAG_ACTIVITY_CLEAR_TOP
				data: 'myapp://index.html?preset=' + preset_data.name, // Must be a well-formed URI
				extras: {
					'android.intent.extra.SUBJECT': 'Preset Roll', // Built-in Android extra (string)
					'preset_name': preset_data.name, // Custom extras are also supported (boolean, number and string only)
				}
			}
		}
		shortcuts.push(shortcut);
	}
	
	window.plugins.Shortcuts.setDynamic(shortcuts, function() {
		//window.alert('Shortcuts were applied successfully');
	}, function(error) {
		//window.alert('Error: ' + error);
	})
}

function RunPreset(preset_name) {
	var preset = null;
	for (var i = 0; i < save_data.presets.length; i++) {
		if (save_data.presets[i].name == preset_name) {
			preset = save_data.presets[i].roll_data;
			break;
		}
	}
	if (preset != null) {
		save_data.current_roll = JSON.parse(JSON.stringify(preset));
		if (mainView.router.currentRoute.url.includes("dicestats")) {
			// because we don't actually "navigate" to dicestats in this case
			// page-next will not be set and we need a hack to run RollDice in page:init
			isFromIntent = true;
			mainView.router.navigate(mainView.router.currentRoute.url, {
				reloadCurrent: true,
				ignoreCache: true,
			});
		}
		else {
			app.router.navigate("/dicestats/");
		}
	}
}

// if cordova is not installed, return
if (document != undefined) {
	
	document.addEventListener("deviceready", function() {
		UpdateAndroidShortcuts();
		
		if (window.plugins != undefined) {
			window.plugins.Shortcuts.getIntent(function(intent) {
				if (intent.extras != undefined && intent.extras["com.ombarus.dicedm.preset_name"] != undefined) {
					var preset_name = intent.extras["com.ombarus.dicedm.preset_name"];
					RunPreset(preset_name);
				}
			})
				
			window.plugins.Shortcuts.onNewIntent(function(intent) {
				if (intent.extras != undefined && intent.extras["com.ombarus.dicedm.preset_name"] != undefined) {
					var preset_name = intent.extras["com.ombarus.dicedm.preset_name"];
					RunPreset(preset_name);
				}
			})
		}
		
	}, false);
	
	
	function ProcessHardwareBack() {
		var opened_diag = $$(".dialog");
		if (opened_diag.length != 0) {
			app.popup.close(opened_diag);
		} else {
			if (mainView.router.currentRoute.url.includes("dicestats")) {
				app.router.navigate("/first/");
				mainView.router.clearPreviousHistory();
			}
			else if (!mainView.router.previousRoute.url.includes("index.html") && !mainView.router.currentRoute.url.includes("first")) {
				app.router.back("/first/");
			}
		}
	}
	
	document.addEventListener('backbutton', function (e) {
		ProcessHardwareBack();
	});
}

//////////////////////////////////////////////////////////////////////////////

