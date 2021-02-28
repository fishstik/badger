var API = chrome || browser;

class Favibadge {
	constructor(cfg_d) {
		//console.log('Favibadge init...');
		this.cfg_d = {
			'size': 32,
			'selector': null,
			'condition': 'capRegex',
			'regex': '(-?[\\d,]+)',
			'iconIndex': null,
			'badgeCfg': {
				'style': 'badge',
				'bgColor': '#dc0000',
				'fgColor': '#ffffff',
				'shape': 'round',
			},
		};
		// merge provided cfg with default cfg
		this.cfg_d = [this.cfg_d, cfg_d].reduce(function (r, o) {
			Object.keys(o).forEach(function (k) { r[k] = o[k]; });
			return r;
		}, {});
		//console.log(`Favibadge config: ${JSON.stringify(this.cfg_d, null, 4)}`);

		this.OGFaviconHref = this.getOGFaviconHref(this.cfg_d['iconIndex']);
		//if (!this.OGFaviconHref) {
		//	console.log('Failed to find favicon! Exiting...');
		//	return;
		//}
		this.unread = null;
		this.lastUnreadCount = null;
	}
	poll() {
		//console.log('Favibadge poll');
		try {
			var countElements = document.querySelectorAll(this.cfg_d['selector']);
			//console.log('Found counter elements:');
			//console.log(countElements);
			this.countElements = countElements;
			this.unread = false;
			var count;
			switch(this.cfg_d['condition']) {
				case 'capRegex':
					if (this.countElements[0] && this.countElements[0].innerText) {
						const m = this.countElements[0].innerText.match(this.cfg_d['regex']);
						if (m) {
							count = m[1] ? m[1] : 'x';
						}
					}
					break;
				case 'matchRegex':
					if (this.countElements[0] && this.countElements[0].innerText) {
						const m = this.countElements[0].innerText.match(this.cfg_d['regex']);
						if (m) {
							count = ' ';
						}
					}
					break;
				case 'notMatchRegex':
					if (this.countElements[0] && this.countElements[0].innerText) {
						const m = this.countElements[0].innerText.match(this.cfg_d['regex']);
						if (m === null) {
							count = ' ';
						}
					}
					break;
				case 'exists':
					if (this.countElements[0] !== null && this.countElements[0] !== undefined) {
						count = ' ';
					}
					break;
				case 'notExists':
					if (this.countElements[0] === null || this.countElements[0] === undefined) {
						count = ' ';
					}
					break;
				case 'count':
					if (this.countElements !== null && this.countElements !== undefined) {
						count = this.countElements.length.toString();
					}
					break;
				case 'sum':
					if (this.countElements !== null && this.countElements !== undefined) {
						const texts = Array.prototype.map.call(this.countElements, function(n) { return n.innerText; });
						const regex = this.cfg_d['regex'];
						var counts = [];
						texts.forEach(function(text, i) {
							const m = text.match(regex);
							if (m) {
								counts.push(text);
							}
						})
						count = Math.floor(counts.reduce((a,b) => parseFloat(a)+parseFloat(b), 0)).toString();
					}
					break;
				default:
					console.log(`Invalid condition \'${this.cfg_d['condition']}\'`);
			}
			//console.log(`Found count \'${count}\' (last = \'${this.lastUnreadCount}\')`);
			if (!([this.lastUnreadCount, '0', 'NaN'].includes(count)) && count !== undefined) {
				//console.log(`Drawing \'${count}\' on favicon`);
				this.drawBadgeOnFavicon(
					count,
					this.cfg_d['badgeCfg']['style'],
					this.cfg_d['badgeCfg']['bgColor'],
					this.cfg_d['badgeCfg']['fgColor'],
					this.cfg_d['badgeCfg']['shape'],
					(canvas) => {
						this.setIcon(canvas.toDataURL('image/png'));
					}
				);
				this.lastUnreadCount = count;
				this.unread = true;
			}
			if (!this.unread && count != this.lastUnreadCount) {
				//console.log(`Setting original favicon`);
				this.getFaviconCanvas((canvas) => { this.setIcon(canvas.toDataURL('image/png')); });
				this.lastUnreadCount = count;
			}
		} catch (err) {
			console.log(`Invalid selector \'${this.cfg_d['selector']}\'`);
			console.log(err);
		}
	}
	getOGFaviconHref(index=null) {
		var icons = [].slice.call(document.head.querySelectorAll('link[rel*="icon"]'));
		icons = icons.sort((a, b) => {
			const sizeA = a.getAttribute('sizes') ? parseInt(a.getAttribute('sizes').split('x')[0], 10) : 0;
			const sizeB = b.getAttribute('sizes') ? parseInt(b.getAttribute('sizes').split('x')[0], 10) : 0;
			if (sizeA === 32) { return 1; }
			if (sizeB === 32) { return -1; }
			return sizeA - sizeB;
		});
		//console.log(`Found ${icons.length} potential icons:`);

		// add root icon if no icons found
		if (!icons.length) {
			var rootIcon = document.createElement('link');
			rootIcon.href = 'https://' + hostname + '/favicon.ico';
			icons.push(rootIcon);
		}

		var iconHrefs = [];
		var tabFaviconIndex = null;
		var tabFaviconHref = this.cfg_d['favIconUrl'];
		icons.forEach(function(icon, i) {
			//console.log(`${i}: ${icon.href}`);
			iconHrefs.push(icon.href);
			if (icon.href === tabFaviconHref) {
				tabFaviconIndex = i;
			}
		})
		// save icon href list to local storage for use in popup.html
		this.cfg_d['iconHrefs'] = iconHrefs;
		API.storage.local.set({[hostname]: this.cfg_d});

		if (index !== null) {
			// user-selected index
			//console.log(`Picked icon ${index} from cfg`);
			return iconHrefs[index];
		} else if (tabFaviconIndex !== null) {
			// index of href that matches tab favicon

			// save to user-selected index
			this.cfg_d['iconIndex'] = tabFaviconIndex;
			API.storage.local.set({[hostname]: this.cfg_d});

			//console.log(`Picked icon ${tabFaviconIndex} from tab favicon`);
			return iconHrefs[tabFaviconIndex];
		} else {
			// last index
			console.log(`Picked last icon ${iconHrefs.length-1}`);
			return iconHrefs.slice(-1)[0];
		}
	}
	getFaviconCanvas(callback) {
		if (!this.faviconCanvas) {
			const size = this.cfg_d.size;
			this.faviconCanvas = document.createElement('canvas');
			this.faviconCanvas.width = size;
			this.faviconCanvas.height = size;

			const ctx = this.faviconCanvas.getContext('2d');

			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = this.OGFaviconHref;
			//img.src = this.cfg_d['favIconUrl'];
			img.decode()
				.then(() => {
					ctx.drawImage(img, 0, 0, size, size);
					callback(this.faviconCanvas);
				})
				.catch(err => console.log(err));
		} else {
			callback(this.faviconCanvas);
		}
	}
	drawBadgeOnFavicon(text, style, bgColor, fgColor, shape, callback) {
		text = text.replaceAll(',', '');
		const chars = text > 999 ? ((text > 9999) ? 9 : Math.floor(text/1000))+'k+' : text;
		if (!this.drawnCanvases) {
			this.drawnCanvases = {};
		}
		if (this.drawnCanvases[chars]) {
			//console.log('Got saved canvas');
			callback(this.drawnCanvases[chars]);
			return;
		} else {
			const numChars = String(chars).length;
			this.getFaviconCanvas((faviconCanvas) => {
				CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
					if (w < 2 * r) r = w / 2;
					if (h < 2 * r) r = h / 2;
					this.beginPath();
					this.moveTo(x+r, y);
					this.arcTo(x+w, y,   x+w, y+h, r);
					this.arcTo(x+w, y+h, x,   y+h, r);
					this.arcTo(x,   y+h, x,   y,   r);
					this.arcTo(x,   y,   x+w, y,   r);
					this.closePath();
					return this;
				}

				const charCanvas = document.createElement('canvas');
				const w = faviconCanvas.width;
				const h = faviconCanvas.height;
				charCanvas.width = w;
				charCanvas.height = h;

				const ctx = charCanvas.getContext('2d');

				if (style === 'overlay') {
					ctx.globalAlpha = 0.66;
					ctx.drawImage(faviconCanvas, 0, 0);
					ctx.globalAlpha = 1.0;

					const fontSize = numChars > 2 ? '17px' : '23px';
					ctx.font = `bold ${fontSize} Segoe UI`;
					ctx.textAlign = 'center';
					ctx.strokeStyle = bgColor;
					ctx.fillStyle = fgColor;
					ctx.lineWidth = 3;
					ctx.strokeText(chars, w/2, h*(3/4));
					ctx.fillText(chars, w/2, h*(3/4));
				} else if (style === 'badge') {
					ctx.drawImage(faviconCanvas, 0, 0);
					const textX = (3-numChars)*(w/3) - ((numChars < 3) ? 2 : -2);
					const textY = h-2 - (numChars == 3);
					const badgeX = textX - ((numChars == 1) ? 3 : 2);
					const badgeY = h/2-2;
					ctx.fillStyle = bgColor;

					ctx.font = `bold ${(numChars < 3) ? '18px' : '16px'} sans-serif`;

					if (shape === 'square') {
						ctx.fillRect(badgeX, badgeY, w-badgeX, h-badgeY);
					} else if (shape === 'round') {
						ctx.roundRect(badgeX, badgeY, w-badgeX, h-badgeY, h-badgeY).fill();
					} else if (shape === 'none') {
						ctx.strokeStyle = bgColor;
						ctx.lineWidth = 3;
						ctx.strokeText(chars, textX, textY);
					}

					ctx.fillStyle = fgColor;
					ctx.fillText(chars, textX, textY);
				} else {
					//console.log(`Invalid badge style \'${style}\'`);
				}
				
				this.drawnCanvases[chars] = charCanvas;
				callback(charCanvas);
			}); //alpha param to getFaviconCanvas
		}
	}
	setIcon(url) {
		var head = document.getElementsByTagName('head')[0];
		const links = Array.from(head.getElementsByTagName('link'));
		// remove old icon
		[].forEach.call(links, function(link) {
			if (link.rel === 'shortcut icon' || link.rel === 'icon') {
				//console.log(`Removing link ${link.href}`);
				head.removeChild(link);
			}
		});
		// add new icon
		const newIcon = document.createElement('link');
		newIcon.type = 'image/png';
		newIcon.rel = 'shortcut icon';
		newIcon.href = url;
		head.appendChild(newIcon);
		//console.log(`Set icon to ${url}`);
	}
}

class FavibadgeInstance {
	constructor(cfg_d = {}) {
		this.favibadge = new Favibadge(cfg_d);
		//console.log('Favibadge polling...');
		this.timer = setInterval(this.favibadge.poll.bind(this.favibadge), 500);
		this.favibadge.poll();
	}
}

//API.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
//	if (msg.action === "sendBadge") {
//		sendResponse({'badge': badge});
//	}
//});

var hostname = window.location.hostname;
(function Extension() {
	API.storage.local.get(null, function(obj) {
		//console.log(obj);
		var cfg_d = obj[hostname] ? obj[hostname] : {'enabled': false};
		if (cfg_d['enabled']) {
			API.runtime.sendMessage({action: 'updateIcon', icon: 'active'});
			return new FavibadgeInstance(cfg_d);
		} else {
			API.runtime.sendMessage({action: 'updateIcon', icon: 'inactive'});
			//console.log(`Favibadge not enabled for ${hostname}`);
			return;
		}
	});
}());
