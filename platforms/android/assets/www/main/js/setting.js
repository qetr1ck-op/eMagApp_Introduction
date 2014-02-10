function cSettingsManager(pOwner) {
	var self = this,
		cvIsTabSelected,
		cvSelectedTab,
		mngSOAP = new cSOAPClient(pOwner),
		cvRSS_Timeout,
		cvAppName,
		cvDateCreated,
		cvDateUpdated;		
	
	function internalError(pMsg) {
		alert('Internal error occured, please restart app.');
	}
	
	function beginSession(pProcess) {
    	mngSOAP.getAppData(function(pResult) {
    		cvAppName = pResult.appName;
    		cvDateCreated = pResult.dateCreated;
    		cvDateUpdated = pResult.dateUpdated;
    		
            $log.info(cvAppName + ': ' + cvDateCreated + ', ' + cvDateUpdated + ', ' + lStorage.getItem('DateUpdated'));
            
            //alert(lStorage.getItem('test'))
            pProcess(!lStorage.getItem('DateUpdated') || (lStorage.getItem('DateUpdated') != cvDateUpdated) /*lStorage.setItem('test', 'test111')*/);
            
            lStorage.setItem('DateUpdated', cvDateUpdated);
            //alert(lStorage.getItem('test'))
            
    	}, internalError);
	}
    
    
	var cvDownloadCompleteEvents = {};
	function downloadIcon(pTab, pClass, pID, pForsed) {
        var vLink = pTab[pClass];
        if (!vLink)
            return;
        
        if (!cvDownloadCompleteEvents[vLink])
            cvDownloadCompleteEvents[vLink] = [];
        
        
        cvDownloadCompleteEvents[vLink].push(function(pAddInfo, pPath) {
                document.styleSheets[0].insertRule('#cpTab' + pID + '>DIV.' +
                pClass.split('_')[2].toLowerCase() + ' {background-image: url(' + pPath + ')}', document.styleSheets[0].cssRules.length);
        });
        
        if (cvDownloadCompleteEvents[vLink].length == 1)
            setTimeout(function() {
                       _$p(vLink, function(pAddInfo, pPath) {
                           for (var i = 0; i < cvDownloadCompleteEvents[vLink].length; i++)
                                cvDownloadCompleteEvents[vLink][i](pAddInfo, pPath);
                        }, null, pForsed);
            }, 100);
	}
	
	function getTab(pTab, pID, pForsed) {
		downloadIcon(pTab, 'TAB_ICON_UP', pID, pForsed);
		downloadIcon(pTab, 'TAB_ICON_DOWN', pID, pForsed);
		
        var vTabType = pID.split('-')[0],
            vSelected = (parseInt(pTab['FIRST_OPEN']) && (vTabType != 'STATIC') && (vTabType != 'EMAIL')) || ((vTabType == 'EMAG') && !cvIsTabSelected);
        cvIsTabSelected |= vSelected;
        
        if (parseInt(pTab['FIRST_OPEN']))
            cvSelectedTab = pID;
        
		return '<li id="cpTab' + pID + '" class="' + (vSelected ? 'selected': '') + '"><div class="' +
			(vSelected ? 'down': 'up') + '">' + pTab['TAB_NAME'] + '</div></li>';
	}	
		
	self.process = function(pComplete) {
		beginSession(function(pForsed) {
	    	mngSOAP.getAppConfig(function(pData) {
                $log.info('getAppConfig: ' + JSON.stringify(pData));
	    		appConfig.customPreload = pData.config.DOWNLOAD;
	    			    		
	    		var vTabs = [], vTab;
                function initProperties(pTab, pObj, pCont) {
                    for (var vPrp in pObj)
                        if (!pObj[vPrp])
                            pCont[vPrp] = pTab[vPrp];
                        else {
                            pCont[vPrp] = {};
                            initProperties(pTab, pObj[vPrp], pCont[vPrp]);
                        }
                }
                                 
	    		function addTab(pName, pPrts) {
                    vTab = pData['tabs'][pName];
	   				vTabs[vTab['TAB_ORDER']] = getTab(vTab, pName, pForsed);
                    initProperties(vTab, pPrts, self[pName] = {});
	    		}
                                 
                for (var vPrp in pData['tabs'])
                    switch (vPrp.split('-')[0]) {
                    case 'NEWS_FEED':
                        addTab(vPrp, {
                        	RSS_LINK: null,
                        	RSS_PN: null
                        });
                        
                        if (vTab['RSS_PN'] && !cvRSS_Timeout)
                        	cvRSS_Timeout = setInterval(pOwner.checkRSSFlag, 3000);
                        break;
                    case 'EMAIL':
                        addTab(vPrp, {
                               ADDRESS: null,
                               SUBJECT: null
                        });
                        break;
                    case 'STATIC':
                        addTab(vPrp, {
                                USE_NAVBUTTONS: null,
                                OPEN_INAPP: null,
                                STATIC_LINK: null
                        });
                        break;
    	    		case 'STATIC_PIC':
                        addTab(vPrp, {
                                 LINK: null,
                                 LINK_PORTRAIT: null,
                                 LINK_LANDSCAPE: null
                        });
                                 
                        _$p(vTab['LINK_PORTRAIT'], function(pAddInfo, pPath) {
                                 self[pAddInfo].PORTRAIT_URL = pPath;
                        }, vPrp, pForsed);
                        _$p(vTab['LINK_LANDSCAPE'], function(pAddInfo, pPath) {
                                 self[pAddInfo].LANDSCAPE_URL = pPath;
                        }, vPrp, pForsed);
                        break;
                    default:
                        var vEMAG = vPrp;
                        break;
                }		
                                 
	    		//!! Always should be as last iteration
	    		if (vTab = pData['tabs'][vEMAG])
	        		mngSOAP.getAppEmags({
	        			search_type: vTab['TYPE'], 
	        			search_value: vTab['VALUE']
	        		}, function(pData) {
	        			appConfig.eMags = pData;
	        			vTabs[vTab['TAB_ORDER']] = getTab(vTab, vEMAG, pForsed);
	        			pComplete(vTabs.join(''), cvSelectedTab);
	        		}, internalError, pForsed);
                                 
	    	}, internalError, pForsed);
		});
		
				
	}
	
	return self;		
}