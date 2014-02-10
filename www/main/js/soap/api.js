function cSOAPClient(pOwner) {
	var self = this;	
	
	function sendRequest(pRequest, pComplete, pError, pForced) {
		for(var vPrp in pRequest["soapenv:Envelope"]["soapenv:Body"]);
		var vFileName = vPrp.replace('urn:WebservicesPortalMobileApp.', '');
		if (pOwner.isConnected() && pForced) {
            $log.info('Read data from server: ' + $xml.toString(pRequest));
			return _$get('http://portal.emagstudio.com/API/api.php?t=WebservicesPortalMobileApp&wsdl',
				function(pResponse, data) {
                    $log.info('DATA FROM REQUEST ' + vFileName + ': ' + $xml.toString(pResponse));
                    writeToFile(vFileName, $xml.toString(pResponse));
                    pComplete(pResponse);
				},
				pError, '<?xml version="1.0" encoding="utf-8"?>' + $xml.toString(pRequest), true, 'post', pForced
			);
        }		
		else {
            $log.info('Read data from file: ' + vFileName);
			readFromFile(vFileName, 
				function(pData) {
                    $log.info('DATA FROM FILE ' + vFileName + ': ' + pData);
					pComplete($xml.fromString(pData));
				}
			);
        }
	}
	    
    function failRead(error) {
        $log.error('File read error: ' + error.code);
    }
    
    function failWrite(error) {
        $log.error('File write error: ' + error.code);
    }    

    function readFromFile(pName, pComplete) {
    	window.fileSystem.root.getFile('download/eMags/' + APP_ID + '/' + pName + '.xml', null, 	
    		function (pFileEntry) {
    			pFileEntry.file(    
    				function (pFile) {
    					var vReader = new FileReader();
    					vReader.onerror = function(evt) {
    						$log.error('Read from file (' + pName + ') error');
    					};
    					vReader.onloadend = function(evt) {
    						pComplete(evt.target.result);
    					};
    					vReader.readAsText(pFile);
    				}, failRead
    			);
        	}, failRead
    	);
    }
        
	function writeToFile(pName, pData) {
		var vFolder = 'download/eMags/' + APP_ID;
    	window.fileSystem.root.getDirectory(vFolder, {create: true, exclusive: false}, 
    			function() {
    				window.fileSystem.root.getFile(vFolder + '/' + pName + '.xml', {create: true, exclusive: false}, 	
    				function (pFileEntry) {
    	    					pFileEntry.createWriter(    
    						function (pWriter) {
    							pWriter.onerror = function(evt) {
    								$log.error('[writeToFile]: Save to file failed: ' + pWriter.fileName);
    							};						
    							pWriter.onwriteend = function(evt) {
    	    							$log.info('[writeToFile]: Sucessfully saved file: ' + pWriter.fileName);
    	    						};
    	    						pWriter.write(pData);        
    	    					}, failWrite);
    	    			}, failWrite);
    	    		}, failWrite);
	}
    
    function getNode(pData, pType) {
        return pData["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:WebservicesPortalMobileApp.get" + pType + "Response"]["return"];
    }
		
	function getResponseNode(pData, pType) {
		return getNode(pData, pType)["response"];
	}
    
    function getErrorNode(pData, pType) {
		return getNode(pData, pType)["error"];
    }
	
	function getFieldValue(pData, pName) {
		return pData[pName]["#text"];
	}
	
	self.getAppData = function(pComplete, pError) {
		return sendRequest(getAppDataRequest, function(pXML) {
			var vData = getResponseNode($xml.toJSONObject(pXML), 'AppData');
                       
            if (vData)
                return pComplete({
                    appName: getFieldValue(vData, 'name'),
                    dateCreated: getFieldValue(vData, 'creation'),
                    dateUpdated: getFieldValue(vData, 'update'),
                    appAccessed: 'someText'
                });
            
            vData = getErrorNode($xml.toJSONObject(pXML), 'AppData');
            alert('104: ' + vData);
            if (vData)
                return pOwner.showAlert('Error!', getFieldValue(vData, 'description'));
                           
            pOwner.showAlert('System Error!', 'Internal error occured, please contact support.');
		}, function(pMsg) {
			$log.error('cSOAPClient.getAppData error: ' + pMsg);
			pError && pError(pMsg);
		}, true);
	};
	
	self.getAppConfig = function(pComplete, pError, pForsed) {
		return sendRequest(getAppConfigRequest, function(pXML) {
			var vData = getResponseNode($xml.toJSONObject(pXML), 'AppConfig');

			pComplete({
				'config': (function() {
					var vConfig = {},
						vList = vData["config"]["item"]; 
					for (var i = 0; i < vList.length; i++) 
						vConfig[getFieldValue(vList[i], 'id')] = 
							getFieldValue(vList[i], 'value');
					
					return vConfig; 
				})(),
				'tabs': (function() {
					var vTabs = {}, vSettings = [], vSet,
						vList = vData["tabs"]["item"];
                    if (!vList.length)
                         vList = [vList];
					for (var i = 0; i < vList.length; i++)
						if (vList[i]["settings"]) {							
                            vSet = vTabs[getFieldValue(vList[i], 'type') + '-' + i] = {};
                            vSettings = vList[i]["settings"]["item"];
							for (var j = 0; j < vSettings.length; j++)
								vSet[getFieldValue(vSettings[j], 'id')] =
									getFieldValue(vSettings[j], 'value');
						}
					
					
					return vTabs; 
				})()
			});
		}, function(pMsg) {
			$log.error('cSOAPClient.getAppConfig error: ' + pMsg);
			pError && pError(pMsg);
		}, pForsed);		
	};
	
	self.getAppEmags = function(pParams, pComplete, pError, pForsed) {
		var vFields = getAppEmagsRequest["soapenv:Envelope"]["soapenv:Body"]["urn:WebservicesPortalMobileApp.getAppEmags"]["return"];
		for (var vPrp in pParams)
			vFields[vPrp]["#text"] = pParams[vPrp]; 		
    
		return sendRequest(getAppEmagsRequest, function(pXML) {
			var vData = getResponseNode($xml.toJSONObject(pXML), 'AppEmags');
                           
			pComplete(function() {				
				var vList = vData['item'], vResult = [], vURL;
                if (vList && !vList.length)
                      vList = [vList];
                if (vList)
                    for (var i = 0; i < vList.length; i++) {
                      vResult[i * 2] = getFieldValue(vList[i], 'name');
                      vURL = getFieldValue(vList[i], 'url');
                      vResult[i * 2 + 1] = (vURL[vURL.length - 1] == '/' ? vURL.substring(0, vURL.length - 1): vURL);  
                    }
				
				return vResult;
			}());
		}, function(pMsg) {
			$log.error('cSOAPClient.getAppEmags error: ' + pMsg);
			pError && pError(pMsg);
		}, pForsed);
	};
}