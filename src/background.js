var API = chrome || browser;

function getHostname(callback) {
	API.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		if (tabs[0] && tabs[0].url) {
			//console.log(`got url: ${tabs[0].url}`);
			var url = new URL(tabs[0].url);
			callback(url.hostname);
		}
	});
}
function onTabActivated(info) {
	getHostname((hostname) => {
		API.storage.local.get(null, function(obj) {
			if (obj[hostname] && obj[hostname]['enabled']) {
				handleMessage({'action': 'updateIcon', 'icon': 'active', 'tabId': info.tabId});
			} else {
				handleMessage({'action': 'updateIcon', 'icon': 'inactive', 'tabId': info.tabId});
			}
		});
	});
}
//function onTabUpdated(tabId, changeInfo, tabInfo) {
//	if (tabId !== API.tabs.TAB_ID_NONE) {
//		getHostname((hostname) => {
//			API.storage.local.get(null, function(obj) {
//				if (obj[hostname] && obj[hostname]['enabled']) {
//					handleMessage({'action': 'updateIcon', 'icon': 'active', 'tabId': tabId});
//
//					if (changeInfo.favIconUrl && !obj[hostname]['favIconUrl']) {
//						console.log(`saved favIconUrl\n${changeInfo.favIconUrl}`);
//						obj[hostname]['favIconUrl'] = changeInfo.favIconUrl;
//						API.storage.local.set({[hostname]: obj[hostname]});
//					}
//				} else {
//					handleMessage({'action': 'updateIcon', 'icon': 'inactive', 'tabId': tabId});
//				}
//			});
//		});
//	}
//}
function handleMessage(msg, sender, sendResponse) {
	const tabId = (sender && sender.tab && sender.tab.id) ? sender.tab.id : msg.tabId;
	if (msg.action === "updateIcon") {
		if (msg.icon === 'active') {
			API.browserAction.setIcon({
				tabId: tabId,
				path: "/icons/active_32.png",
			});
			API.browserAction.setTitle({
				tabId: tabId,
				title: "Shaking Badger is active!",
			});
			API.browserAction.setBadgeText({
				tabId: tabId,
				text: " ",
			});
			API.browserAction.setBadgeBackgroundColor({
				tabId: tabId,
				color: "#ff799a",
			});
		} else {
			API.browserAction.setIcon({
				tabId: tabId,
				path: "/icons/inactive_32.png"
			});
			API.browserAction.setTitle({
				tabId: tabId,
				title: "shhh, Sleeping Badger is sleeping...",
			});
			API.browserAction.setBadgeText({
				tabId: tabId,
				text: "",
			});
		}
    }
}

API.runtime.onMessage.addListener(handleMessage);
API.tabs.onActivated.addListener(onTabActivated);
//API.tabs.onUpdated.addListener(onTabUpdated);
