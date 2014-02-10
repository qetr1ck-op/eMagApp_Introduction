function Downloader() {
	this.events = {};
	
	this.preload = function(url, params, win, fail) {
		this.events[url] = {
			complete: win,
			error: fail
		};
		
		PhoneGap.exec("Downloader.preload", url, params.fileName, params.dirName, params.Forced || false);
	};
	
	this.complete = function(pURL, pPath) {
		var vObj = this.events[pURL];
		if (vObj && vObj.complete)
			vObj.complete(pPath);
	};
	
	this.error = function(pURL, pPath) {
		var vObj = this.events[pURL];
		if (vObj && vObj.error)
			vObj.error(pPath);
	};
}

Downloader.install = function() {   
	if(!window.plugins)
		window.plugins = {};

	window.plugins.downloader = new Downloader();
};