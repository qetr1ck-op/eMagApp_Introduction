var APP_ID = "2pLZ-y5Ki-Hd6J-UXmF",	
	soapAppIDField = {
		"app_id": $soap.createField("string", APP_ID)
	},
	URN = "urn:WebservicesPortalMobileApp";
	
	getAppDataRequest = $soap.createRequest(URN, 'getAppData', soapAppIDField),
	getAppConfigRequest = $soap.createRequest(URN, 'getAppConfig', soapAppIDField),	
	getAppEmagsRequest =  $soap.createRequest(URN, 'getAppEmags', _$merge (soapAppIDField, {		
		"search_type": $soap.createField('string', ''),
		"search_value": $soap.createField('string', '')
	}));