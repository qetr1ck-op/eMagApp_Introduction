//@Overwrite HTML READER Preload method
function getLocalPathPrefix() {
    return 'file:///';
}

function getLocalPath(pURL) {
    var vPath = window.fileSystem.root.fullPath + '/download/eMags/';
    if (pURL) return pURL.replace('http://', vPath).replace('https://', vPath);
    else return pURL;
}

_$p = function (pURL, pSucceedFunc, pAddInfo, pForced) {
    var vLocalPath = getLocalPath(pURL);
    if (lStorage.getItem(pURL) && (!pForced || !eMagPromo.isConnected()))
    	pSucceedFunc && pSucceedFunc(pAddInfo, lStorage.getItem(pURL));
    else
        if (eMagPromo.isConnected())
            plugins.downloader.preload(pURL, {
                fileName: vLocalPath.substr(vLocalPath.lastIndexOf('/') + 1, vLocalPath.length),
                dirName: vLocalPath.substr(0, vLocalPath.lastIndexOf('/')).replace(getLocalPathPrefix(), ''),
                Forced: pForced
            }, function (pValue) {
                var vBase = getLocalPathPrefix();
                lStorage.setItem(pURL, (pValue.indexOf(vBase) >= 0 ? '': vBase) + pValue.replace(/ /gm, '%20'));
                pSucceedFunc && pSucceedFunc(pAddInfo, lStorage.getItem(pURL));
            }, function (pError) {
                (typeof pAddInfo == 'function') && pAddInfo(pURL);
                $log.error("Download ERROR: " + pError);
            });
        else
            $FS.fileExists(vLocalPath, function(pExists) {
                if (pExists)
                    pSucceedFunc && pSucceedFunc(pAddInfo, vLocalPath);
                else {
                    (typeof pAddInfo == 'function') && pAddInfo();
                    $log.error("Download ERROR: file can't be reached (" + vLocalPath + ")");
                    setTimeout(_$p, 5000, pURL, null, null, pForced);
                }
            });
}

preload = $dom.p;
$dom.p = function (pElt, pURL, pUploadURL, pCompleteFunc) {
    preload(pElt, pURL, getLocalPath(pUploadURL), pCompleteFunc);
};

uget = _$get;
_$get = function(url, success, error, params, isXML, method, forced) {
    return uget(forced ? url : lStorage.getItem(url) || getLocalPath(url), success, error, params, isXML, method);
};

function _$appendStyle(pValue) {
	var head = document.getElementsByTagName('head')[0],
    	style = document.createElement('style'),
    	rules = document.createTextNode(pValue);

	style.type = 'text/css';
	if(style.styleSheet)
		style.styleSheet.cssText = rules.nodeValue;
	else 
		style.appendChild(rules);
	
	return head.appendChild(style);
}

function _$clone(pObj) {
    if (pObj instanceof Object) {
        var vCopy = {};
        for (var vAttr in pObj)
            if (pObj.hasOwnProperty(vAttr)) 
            	vCopy[vAttr] = _$clone(pObj[vAttr]);
            else
            	vCopy[vAttr] = pObj[vAttr];
        
        return vCopy;
    }
    else
    	return pObj; 
}