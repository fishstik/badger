var API = chrome || browser;

function getActiveTab(callback) {
	API.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		if (tabs[0] && tabs[0].url) {
			callback(tabs[0]);
		}
		//if (tabs[0] && tabs[0].url) {
		//	var url = new URL(tabs[0].url);
		//	callback(url.hostname);
		//}
	});
}
function toggleOptionInputsDisable(disable=null) {
	document.querySelectorAll('.optionInput').forEach(function(element) {
		if (disable === null) {
			if (element.id === 'swapCols') {
				element.style.filter = element.style.filter === 'opacity(0.5)' ? 'opacity(1)' : 'opacity(0.5)';
				element.style.pointerEvents = element.style.pointerEvents === 'auto' ? 'none' : 'auto';
			} else if (element.id !== 'cbEnable') {
				element.style.pointerEvents = element.style.pointerEvents === 'auto' ? 'none' : 'auto';
				element.disabled = !element.disabled;
			}
		} else {
			if (element.id === 'swapCols') {
				element.style.filter = disable ? 'opacity(0.5)' : 'opacity(1)';
				element.style.pointerEvents = disable ? 'none' : 'auto';
			} else if (element.id !== 'cbEnable') {
				element.style.pointerEvents = disable ? 'none' : 'auto';
				element.disabled = disable;
			}
		}
	});
}
function populateFields(cbOverride=null) {
	getActiveTab((tab) => {
		var url = new URL(tab.url);
		var hostname = url.hostname;

		var buttSave = document.querySelector('#save')

		buttSave.disabled = true;
		document.querySelector('#domain').innerText = hostname;
		API.storage.local.get(null, function(cfg) {
			var cbEnable = document.querySelector('#cbEnable');
			var txtSelector = document.querySelector('#txtSelector');
			var selCondition = document.querySelector('#selCondition');
			var txtRegex = document.querySelector('#txtRegex');
			var selBadgeStyle = document.querySelector('#style');
			var selBadgeShape = document.querySelector('#shape');
			var colBadgeBG = document.querySelector('#colorBG');
			var colBadgeFG = document.querySelector('#colorFG');

			if (cfg[hostname]) {
				// Populate icons before checking need to disable because they need to have optionInput class
				if (!document.querySelector('#iconGrid').hasChildNodes()) {
					populateIcons(cfg[hostname]['iconHrefs'], parseInt(cfg[hostname]['iconIndex'], 10));
				}
				if (cfg[hostname]['enabled']) {
					cbEnable.checked = true; //cfg[hostname]['enabled'];
					//API.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					//	if (tabs[0].url) {
					//		API.runtime.sendMessage({
					//			tabId: tabs[0].id,
					//			action: 'updateIcon',
					//			icon: cbEnable.checked ? 'active' : 'inactive',
					//		});
					//	}
					//});
				} else {
					toggleOptionInputsDisable(true)
				}
				txtSelector.value = cfg[hostname]['selector'];
				selCondition.value = cfg[hostname]['condition'] ? cfg[hostname]['condition'] : 'capRegex';
				txtRegex.value = cfg[hostname]['regex'] ? cfg[hostname]['regex'] : '(-?[\\d,]+)';
				if (cfg[hostname]['badgeCfg']) {
					badgeCfg = cfg[hostname]['badgeCfg'];
					selBadgeStyle.value = badgeCfg['style'];
					selBadgeShape.value = badgeCfg['shape'];
					colBadgeBG.value = badgeCfg['bgColor'];
					colBadgeFG.value = badgeCfg['fgColor'];
				}
			} else {
				// Default values if domain not saved
				cbEnable.checked = false;
				toggleOptionInputsDisable(true)

				txtSelector.value = 'title';
				txtRegex.value = '(-?[\\d,]+)';
				document.querySelector('#iconOption').style.display = 'none';
				selBadgeStyle.value = 'badge';
				selBadgeShape.value = 'round';
				colBadgeBG.value = '#dc0000';
				colBadgeFG.value = '#ffffff';
			}

			if (cbOverride !== null) {
				toggleOptionInputsDisable(!cbOverride)
				cbEnable.checked = cbOverride;
				buttSave.disabled = false;
			}

			updateTxtRegexVisibility();
			updateWarnings();
		});
	});
}
function populateIcons(hrefs, selected=NaN, size='32px') {
	if (isNaN(selected)) { selected = -1; }
	if (hrefs) {
		var iconGrid = document.querySelector('#iconGrid');
		var divRow = document.createElement('div');
		divRow.className = 'row';
		iconGrid.appendChild(divRow);
		hrefs.forEach(function(href, i) {
			var divCol = document.createElement('div');
			divCol.className = 'col';
			divRow.appendChild(divCol);

			var img = document.createElement('img');
			img.classList.add('icon');
			img.classList.add('optionInput');
			if ((selected >= 0 && i == selected) || (selected < 0 && i-hrefs.length == selected)) {
				img.classList.add('selected');
			}
			img.src = href;
			img.addEventListener('click', function() {
				if (!img.classList.contains('selected')) {
					document.querySelector('#save').disabled = false;
					document.querySelectorAll('.icon').forEach(function(icon, i) {
						icon.classList.remove('selected');
					})
					img.classList.add('selected');
				}
			});
			divCol.appendChild(img);
		})
	} else {
		//console.log('No hrefs provided to populateIcons');
		document.querySelector('#iconOption').style.display = 'none';
	}
}
function updateTxtRegexVisibility() {
	var selCondition = document.querySelector('#selCondition')
	var colLRegex = document.querySelector('#colLRegex');
	var colRRegex = document.querySelector('#colRRegex');
	if (['exists', 'notExists', 'count'].includes(selCondition.value)) {
		colLRegex.style.display = 'none';
		colRRegex.style.display = 'none';
	} else {
		colLRegex.style.display = 'table';
		colRRegex.style.display = 'table';
	}
}
function updateWarnings() {
	var saveBtn = document.querySelector('#save');

	var capRegexWarning = document.querySelector('#capRegexWarning');
	capRegexWarning.style.display = 'none';
	if (['capRegex', 'sum'].includes(document.querySelector('#selCondition').value)) {
		var str = document.querySelector('#txtRegex').value;
		str = str.replace('\\(', '');
		str = str.replace('\\)', '');
		if (!(str.includes('(') && str.includes(')'))) {
			capRegexWarning.style.display = 'initial';
			saveBtn.disabled = true;
		}
	}
	var txtSelector = document.querySelector('#txtSelector');
	var txtSelWarning = document.querySelector('#txtSelWarning');
	txtSelWarning.style.display = 'none';
	try {
		document.querySelector(txtSelector.value);
	} catch (err) {
		txtSelWarning.style.display = 'initial';
		saveBtn.disabled = true;
	}
}
function save() {
	const cbEnable = document.querySelector('#cbEnable');

	getActiveTab((tab) => {
		const url = new URL(tab.url);
		const hostname = url.hostname;

		API.storage.local.get(null, function(obj) {
			var cfg_d = obj[hostname] ? obj[hostname] : {};
			cfg_d['enabled'] = cbEnable.checked;
			if (cbEnable.checked) {
				cfg_d['selector']  = document.querySelector('#txtSelector').value;
				cfg_d['condition'] = document.querySelector('#selCondition').value;
				cfg_d['regex']     = document.querySelector('#txtRegex').value;
				document.querySelectorAll('.icon').forEach(function(icon, i) {
					if (icon.classList.contains('selected')) {
						cfg_d['iconIndex'] = i;
					}
				})
				cfg_d['badgeCfg'] = cfg_d['badgeCfg'] || {};
				cfg_d['badgeCfg']['style']   = document.querySelector('#style').value;
				cfg_d['badgeCfg']['shape']   = document.querySelector('#shape').value;
				cfg_d['badgeCfg']['bgColor'] = document.querySelector('#colorBG').value;
				cfg_d['badgeCfg']['fgColor'] = document.querySelector('#colorFG').value;

				if (tab.favIconUrl && !cfg_d['favIconUrl']) {
					cfg_d['favIconUrl'] = tab.favIconUrl;
				}
			}
			API.storage.local.set({[hostname]: cfg_d});
			//console.log('Submitted');
			//console.log(`${JSON.stringify(cfg_d, null, 4)}`);
		});
	});
}
function toggleDark(override=null) {
	var toggDark = document.querySelector('#toggDark');
	if (override === null) {
		document.body.classList.toggle("dark-mode");
	} else if (override === true) {
		document.body.classList.add("dark-mode");
	} else if (override === false) {
		document.body.classList.remove("dark-mode");
	}
	if (document.body.classList.contains('dark-mode')) {
		API.storage.local.set({'darkMode': true});
		toggDark.innerText = '☀';
	} else {
		API.storage.local.set({'darkMode': false})
		toggDark.innerText = '◐';
	}
}

populateFields();
API.storage.local.get('darkMode', function(obj) { toggleDark(obj['darkMode']); });

// enable checkbox click
document.querySelector('#cbEnable').addEventListener('click', function() { populateFields(this.checked); });

// any option input change
document.querySelectorAll('.optionInput').forEach(function(element) {
	element.addEventListener('input', function(event) {
		// enable save button
		document.querySelector('#save').disabled = false;
		updateWarnings();
	});
});

// condition dropdown change
document.querySelector('#selCondition').addEventListener('change', function() { updateTxtRegexVisibility(); });

// style dropdown change
document.querySelector('#style').addEventListener('change', function() {
	// disable shape dropdown if overlay style chosen
	document.querySelector('#shape').disabled = this.value == 'overlay';
});

// prevent swap color text double-click selection
document.querySelector('#swapCols').addEventListener('mousedown', function(e) { e.preventDefault(); });
// swap color text click
document.querySelector('#swapCols').addEventListener('click', function() {
	var colBadgeFG = document.querySelector('#colorFG');
	var colBadgeBG = document.querySelector('#colorBG');
	const colFG = colBadgeFG.value;
	const colBG = colBadgeBG.value;
	colBadgeFG.value = colBG;
	colBadgeBG.value = colFG;

	document.querySelector('#save').disabled = false;
});

// save button click
document.querySelector('#save').addEventListener('click', function() { 
	save(); 
	this.disabled = true;
});
// reload button click
document.querySelector('#reload').addEventListener('click', function() {
	API.tabs.query({active: true, currentWindow: true}, function(tabs) {
		API.tabs.reload(tabs[0].id);
		window.close();
	});
});
// reset button click
document.querySelector('#reset').addEventListener('click', function() {
	getActiveTab((tab) => {
		var url = new URL(tab.url);
		var hostname = url.hostname;
		API.storage.local.remove([hostname]);
		populateFields();
	});
});

// prevent dark mode toggle text double-click selection
document.querySelector('#toggDark').addEventListener('mousedown', function(e) { e.preventDefault(); });
// dark mode toggle text click
document.querySelector('#toggDark').addEventListener('click', function() { toggleDark(); });
