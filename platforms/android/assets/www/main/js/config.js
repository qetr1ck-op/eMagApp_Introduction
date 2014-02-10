var TOOL_BAR_HEIGHT = 46;

appConfig.customPreload = true;
appConfig.customDesign = {};
appConfig.customDesign.URL = false; //'http://192.168.0.61/customDesign';
appConfig.customDesign.fileCount = 19;
appConfig.securityStatus = false;
appConfig.accessStatus = false;
appConfig.vPrlBtnPressed = false;
appConfig.customDesign.pathes = {
    'img': {
    	'**': ['progress.png'], 
		'icons': [
		    'contact_down.png', 
		    'contact_up.png',
		    'news_down.png',
		    'news_up.png',
		    'read_down.png',
		    'read_up.png',
		    'welcome_down.png',
		    'welcome_up.png'
		],
		'social': [
		    'icon_facebook.png',
		    'icon_rss.png',
		    'icon_twitter.png',		    
		    'newsfeed_selected.png'       
		],
		'theme': [
		    'button_back.png',
		    'navbar_common.png',
		    'navbar_selected.png'
		] 
    },
    'css': [
    	'cflow.css',
    	'promo.css',
    	'twitter.css'
    ]
};
eMagReader.labels = {
	accessprotection_plugin : {
		"accessProtectionCredentialsFormSubmit": "Submit",
        "accessProtectionCredentialsFormLogin": "login:",
        "accessProtectionCredentialCheckPleaseWait": "Please wait...",
        "accessProtectionCredentialsFormPassword": "password:",
        "accessProtectionWindowTitle": "Access Protection",
        "accessProtectionCredentialCheckFailed": "Login or password are incorrect, please try once again",
        "accessProtectionNoPassword": "Please enter password",
        "accessProtectionNoLogin": "Please enter login name",
        "accessProtectionBack" : "&nbsp;Back&nbsp;"
	}
}