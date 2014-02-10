function Downloader() {}

Downloader.prototype.preload = function(fileUrl, params, win, fail) {
	PhoneGap.exec(win, fail, "Downloader", "preload", [fileUrl, params]);
};

Downloader.install = function() {   
	if(!window.plugins)
		window.plugins = {};

	window.plugins.downloader = new Downloader();
};