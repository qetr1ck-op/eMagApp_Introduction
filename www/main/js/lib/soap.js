/*
	should be already initialized following objects:
    	soapRequestWrapper, soapRequestBase
*/

var $soap = function() {
	function getWrappedRequest(pBody, pHead) {
		var vWR = {
			"soapenv:Envelope": {
				"#attributes": {
					"xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance",
					"xmlns:xsd":"http://www.w3.org/2001/XMLSchema",
					"xmlns:soapenv":"http://schemas.xmlsoap.org/soap/envelope/",
					"xmlns:urn":"urn:WebservicesPortalMobileApp"
				},
				"soapenv:Header":{},
				"soapenv:Body": {}
			}		
		};
		
		if (pHead)
			vWR["soapenv:Envelope"]["soapenv:Header"] = pHead;
		if (pBody)
			vWR["soapenv:Envelope"]["soapenv:Body"] = pBody;
		
		return vWR; 
	} 

	return {
		createRequest: function(pName, pExt) {
			var vSR = {},
				vSRT = (vSR["urn:WebservicesPortalMobileApp." + pName] = {
						"#attributes": {
							"soapenv:encodingStyle":"http://schemas.xmlsoap.org/soap/encoding/"
						},
						"return": {
							"#attributes": {
								"xsi:type":""
							}
						}
					} 
				);
			vSRT["return"]["#attributes"]["xsi:type"] = pName + 'Request';
			
			if (pExt)
				for (var vPrt in pExt)
					vSRT["return"][vPrt] = pExt[vPrt];
			
			return getWrappedRequest(vSR); 
		},
		createField: function(pType, pValue) {
			return {
				"#attributes": {
					"xsi:type":"xsd:" + pType
				},
				"#text": pValue
			};
		},
		sendRequest: function(pURL, pRequest, pComplete, pError) {
			$log.info('Read data from server: ' + $xml.toString(pRequest));
			return _$get(pURL,
				pComplete,
				pError,
				'<?xml version="1.0" encoding="utf-8"?>' + $xml.toString(pRequest),
				true, 'post', true
			);
		}
		
	};	
}();
/*function sendRequest(pURL, pRequest, pComplete, pError) {
    $log.info('Read data from server: ' + $xml.toString(pRequest));
	return _$get(pURL,
		pComplete,
		pError,
		'<?xml version="1.0" encoding="utf-8"?>' + $xml.toString(pRequest),
		true, 'post', true
	);
}*/