function cDesignManager(pOwner) {
	var self = this;
	
    function downloadDesign(pURL, pList, pComplete, pError) {
    	if (pList instanceof Array)    	
    		for (var i = 0; i < pList.length; i++)
    			_$p(pURL + '/' + pList[i], pComplete,
    	   			function(pValue) {
    	   				$log.error('Design download error: ' + pValue);
    	   				pError(pValue);
    	   			}
    	   		);
    	else
    		for (var vPrp in pList)    			
    			downloadDesign(pURL + (vPrp == '**' ? '': '/' + vPrp), pList[vPrp], pComplete);    	
    }

    function appendStyle(pBasePath, pFilePath) {
    	return _$appendStyle(
    		_$get(pFilePath).replace(/url\(\.\./igm, 'url(' + pBasePath)
    	);    	
    }
    
    self.process = function(pCallback) {
    	function vComplete() {
			$dom.show(pOwner.tabBar);   
			pCallback();    		
    	}
    	
    	function vDefaultDesignLoad() {
    		var vCSSs = ['cflow.css','promo.css','twitter.css'];
			for (var i = 0; i < vCSSs.length; i++)
				appendStyle('main', 'main/css/' + vCSSs[i]);
			vComplete();
    	}
    	
    	if (appConfig.customDesign.URL) {    	
    		var vError = false,
    			vStyles = [],
    			vLocalPath = getLocalPath(appConfig.customDesign.URL),
    			vDownloadedCount = 0;
    		downloadDesign(
    			appConfig.customDesign.URL, 
    			appConfig.customDesign.pathes,
    			function (pError, pPath) {    					
    				$log.info('Downloaded Design: ' + pPath)
    				    				
    				if (vError)
    					return;
    			
    				vDownloadedCount++;
    				if (pPath.indexOf('.css') > 0)    				
    					vStyles.push(appendStyle(vLocalPath, pPath));    		
    					
    				if (appConfig.customDesign.fileCount == vDownloadedCount) 
    					vComplete();
    			},
    			function(pValue) {
    				vError = true;
    				for (var i = 0; i < vStyles.length; i++)
    					vStyles[i].parentNode.removeChild(vStyles[i]);
    					
    				vDefaultDesignLoad();
    			}
    		);    		
    	}
    	else
    		vDefaultDesignLoad();
    }
	
	return self;
}