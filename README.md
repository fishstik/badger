# Shaking Badger

The universal favicon badger.

This browser extension allows you to add an indicator to any site's favicon. Built to be flexible and customizable.

### Installation

Install from [Chrome Web Store](https://chrome.google.com/webstore/detail/shaking-badger/gafjecdpjgeeapalfnbdlpjmcojmpjjg) and Firefox Addons (coming soon).

Install from source as an unpacked extension in [Chrome](https://developer.chrome.com/extensions/getstarted#unpacked) or [Firefox](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

### Usage

Shaking Badger is disabled by default. To enable it for a site, navigate to the site, activate the extension, and check the "enabled" checkbox.

The Badger needs to know how to badge the favicon. To tell it, determine a [selector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) that will select a relevant HTML element on the page. Your browser's "Inspect element" tool can help with this.

You can customize the Badger's badging behavior by setting the condition and a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) (if applicable). To extract a number from an HTML element on the page, use the `capture regex` condition and [capture](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet#Groups_and_ranges) a portion (or all) of the regular expression using parentheses.

#### Examples

##### Count unread messages in Facebook:
**w<span>ww.facebook.com**  
selector: `title`  
condition: `capture regex`  
regex: `\(([\d,]+)\)`

##### Indicate unread notifications in GitHub
**github.com**  
selector: `.mail-status.unread`  
condition: `exists`

##### Indicate delivered package on Amazon package tracker
**w<span>ww.amazon.com**  
selector: `#primaryStatus`  
condition: `matches regex`  
regex: `Delivered`

##### Count number of unread threads in Facebook Messenger:
**w<span>ww.messenger.com**  
selector: `._6zv_`  
condition: `count occurrences`

### License

Licensed under the MIT License.
