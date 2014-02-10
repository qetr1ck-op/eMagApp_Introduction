cordova.define("com.phonegap.plugins.downloader.downloader", function(require, exports, module) {function Downloader() {}

Downloader.prototype.preload = function(fileUrl, params, win, fail) {
	cordova.exec(win, fail, "Downloader", "preload", [fileUrl, params]);
};

Downloader.prototype.install = function() {   
	if(!window.plugins)
		window.plugins = {};

	window.plugins.downloader = new Downloader();
};

module.exports = new Downloader();});
