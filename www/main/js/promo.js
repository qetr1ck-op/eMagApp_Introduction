var eMagPromo = new(function () {
    var self = this,
        cvInited = false,
        cvCache = {},
        mngDownloader = new cDownloadManager(self),
        mngSettings = new cSettingsManager(self),
        mngDesign =  new cDesignManager(self),
        mngSecurityApp,
        cvCurName, 
        cvDataURL, 
        cvImgDir, 
        cvLastWidth, 
        cvPosition = 1,
        cvCoverFlow, 
        cvEMags = appConfig.eMags, 
        cvReaderLock = false,
        cvTabs = [],
        cvPaused;
    
    function deviceready(e) {
        $log.info('ondeviceready');
        
        function start() {
            document.addEventListener("pause", function() {
            	cvPaused = true;
            }, false);
            document.addEventListener("resume", function() {
            	cvPaused = false;
            }, false);

             checkConnection();
             installChildBrowser();
             installDownloader();
             
             window.lStorage = new cLocalStorage();
             mngSecurityApp = new cSecurityManagerApp(self);

             init();
        }	
        
        function check() {
            if (isConnected())
            	start();
            else            	
        		showAlert('Information', 'This App requires an Internet connection to run for the first time. Please connect your device to the Internet before press confirmation button.', 'Connected', check);        	
        }
                           
        checkLocalFileSystem(function() {
            if (isConnected())
            	start();
            else
            	$FS.fileExists('download/eMags/' + APP_ID + '/getAppData.xml', function(pExists) {
           			setTimeout(pExists ? start: check, 100);
            	});
        });
    };

    function installChildBrowser() {
        try {
            if (ChildBrowser.install) 
            	ChildBrowser.install();
        } catch (err) {
            $log.info(err);
        }        
        if (window.plugins.childBrowser) {
        	window.plugins.childBrowser.onLocationChange = function (loc) {
                $log.info("CB loc change:" + loc);
            };
            window.plugins.childBrowser.onClose = function () {
                $log.info("CB close");
            };
            window.plugins.childBrowser.onOpenExternal = function () {
                $log.info("CB openExtern");
            };
        }
    }    

    function installDownloader() {
        try {
            if (Downloader.install) 
            	Downloader.install();
        } catch (err) {
            $log.info(err);
        }        
    }
            
    function showAlert(pCaption, pMessage, pButton, pCallback) {
        navigator.notification.alert(pMessage, pCallback, pCaption, pButton);
    }
    self.showAlert = showAlert;
                    
    function isConnected() {
        var networkState = navigator.network.connection.type;
        return (networkState && (networkState != Connection.NONE) && (networkState != 'unknown'));
    }
    self.isConnected = isConnected;
    
    function checkConnection() {
        $log.info('check network reachability' + navigator.network);
        $log.info('network state ->' + navigator.network.connection.type);
        if (!isConnected())
            showAlert('Warning!', 'There was an error connecting to the Internet. Some functionality will be disabled.', 'OK');
    }
    self.checkConnection = checkConnection;

    function checkLocalFileSystem(pCallback) {
        // request the persistent file system
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            window.fileSystem = fileSystem;
            //Prepare publications
            pCallback();
        }, function () {
            showAlert('Fatal Error!', 'Undefined file system', 'OK');
        });
    }
    
    function closeReader() {
		_$("#backBar").style.display = 'none';
		_$("UL", self.tabBar).style.display = 'block';
		eMagReader.unLoadData();
		cvReaderLock = false;
		
		initCases();
	}
    self.closeReader = closeReader;

    function init() {
    	self.showPreloader(true, true);
        document.body.addEventListener('touchmove',
        	function (e) {
            	e.preventDefault();
        	}, false
        );

        self.tabBar =  _$("#tabsControl");
        self.content = _$("#content");        
        
        mngDesign.process(function() {
        	mngSettings.process(function (pTabs, pSelectedTab) {
        		_$('UL', self.tabBar).innerHTML = pTabs; 
        		cvEMags = appConfig.eMags;
               		
        		setInterval(function () {
        			if (innerWidth != cvLastWidth) 
        				changedOrientation();
        		}, 300);        		        	
        
        		//menu control
        		cvTabs = _$("UL>LI", self.tabBar, false, true);
        		for (var i = 0; i < cvTabs.length; i++) {
        			cvTabs[i].style.width = (100 / cvTabs.length) + '%';
        			cvTabs[i].addEventListener('click', onTabSwitch);
                    if (cvTabs[i].className == 'selected')
                        vSelectedTab = cvTabs[i].id.substr(5);
        		}
                              
                if (vSelectedTab != pSelectedTab)
                    processCommand(vSelectedTab);
                
        		pSelectedTab && processCommand(pSelectedTab);
                self.showPreloader(false);
                                
        		_$("#backBar>A").addEventListener("click", closeReader, false);
        		
        		mngSecurityApp.checkSecurityStatus(); 		
        	});        	
        });
 };
    
    function touchmove(e) {
        e.preventDefault();
    };

    self.checkRSSFlag = function() {
    	if(!cvPaused)
    		return;
    	
        function fail(error) {
            $log.error('File read/write error: ' + error.code);
        }
    	
    	var vFlagFilePath = 'download/eMags/' + APP_ID + '/rss.flag';
    	window.fileSystem.root.getFile(vFlagFilePath, null, 	
        		function (pFileEntry) {
        			pFileEntry.file(    
        				function (pFile) {
        					var vReader = new FileReader();
        					vReader.onerror = function(evt) {
        						$log.error('Read from file (rss.flag) error');
        					};
        					vReader.onloadend = function(evt) {
        						if (evt.target.result == '+') {        							        							
        							closeReader();
        							for (var i = 0; i < cvTabs.length; i++) 
        								if (cvTabs[i].id.indexOf('NEWS_FEED') > 0) {
        									updateSelectedTab(_$('DIV', cvTabs[i]));
        									processCommand(cvTabs[i].id.substr(5), true);
        									break;
        								}        							        							        							        						
        							
        							window.fileSystem.root.getFile(vFlagFilePath, 
        									{create: true, exclusive: false}, 	
        									function (pFileEntry) {
        										pFileEntry.createWriter(    
        											function (pWriter) {
        												pWriter.onerror = function(evt) {
        													$log.error('[writeToFile]: Save to file failed: ' + pWriter.fileName);
        												};
        												pWriter.onwriteend = function(evt) {
        													$log.info('[writeToFile]: Sucessfully saved file: ' + pWriter.fileName);
        												};
        												pWriter.write('');        
        											}, fail
        										);
        								    }, fail
        								);
        						}
        					};
        					vReader.readAsText(pFile);
        				}, fail
        			);
            	}, fail
        	);
    };
    
    self.showPreloader = function (value, screen) {
    	var vPreloaderImg = _$("#preloaderImg"),
    		vPreloader = _$("#preloader");
        $dom.move(vPreloaderImg, (window.innerWidth - 41) / 2, (window.innerHeight - TOOL_BAR_HEIGHT - 39) / 2);
                    $dom.size(vPreloader, window.innerWidth, window.innerHeight - (screen ? 0 :TOOL_BAR_HEIGHT));
        
        $dom[value ? 'show' : 'hide'](vPreloader);                
    };

    self.updateScroll = function () {
        var vScroll = _$('#scroll', self.content, true);
        if (vScroll) {
            if (!vScroll.instance) new csc(vScroll, false, true);

            vScroll.instance.refresh();
        }
    };

    self.openUrl = function (url, hideNavBar) {
    	if (!url)
    		return false;
    	
        $log.info('external url ' + url);

        if (window.plugins && window.plugins.childBrowser) {
            $log.info('child browser');
            window.plugins.childBrowser.showWebPage(url, hideNavBar);
        } else {
            $log.info('window open');
            window.location = url;
        }
        return true;
    };

    self.updateSize = function () {
        $log.info('Size updating ->' + innerWidth + ';h->' + innerHeight);

        cvLastWidth = innerWidth;
        var vWrapper = self.content.parentNode;
        vWrapper.style.width = innerWidth + "px";
                
        resizeImagePage();
        self.updateScroll();

        if (_$('#container', self.content, true))
        	updateReaderSize(eMagReader['_prevBits'], true);        	
        else 
        	self.tabBar.style.top = 
        	vWrapper.style.height = 
        		innerHeight - TOOL_BAR_HEIGHT + "px";
    };

    function changedOrientation() {
    	//Cover Frow Invalidate
    	if (cvCoverFlow)
        	(cvCoverFlow.i || cvCoverFlow.invalidate)();
        //Update Promo 
        self.updateSize();
    }

    function updateReaderSize(pBits, pForced) {
    	var vMenuBarShow = ((pBits & parseInt(00000001, 2)) === 0);
        if (!pForced && (pBits === eMagReader['_prevBits'])) return;

        var vWrapper = self.content.parentNode,
            vSize = (vMenuBarShow ? TOOL_BAR_HEIGHT : 0);
        vWrapper.style.top = vSize + 'px';
        vWrapper.style.height = innerHeight - vSize + 'px';                
        
        eMagReader.Height = innerHeight - vSize;               
        eMagReader.Width = innerWidth;                
        eMagReader._prevBits = pBits;
        eMagReader.i(); //invalidate optimized
    }

    function setupViewer(htmlPage) {
        _$("#tabsControl>UL").style.display = 'none';
       
        self.content.innerHTML = htmlPage.match(/<body id="content">(.*?)<\/body>/g);
        self.content.parentNode.style.background = '#666';
               
        self.updateScroll(true);

        appConfig.basePath = 'reader/';
        appConfig.dataUrl = cvDataURL;
        appConfig.imgDir = cvImgDir;

        eMagReader.Width = innerWidth;
        eMagReader.Height = innerHeight - TOOL_BAR_HEIGHT;
           
        if (!eMagReader.onLoadData_i) {
            eMagReader.onLoadData_i = eMagReader.old;
            eMagReader.old = function () { //!onLoadData optimized\
                eMagReader.onLoadData_i();
                eMagReader.msp.onStateChanged = updateReaderSize;
                //!! mngScreenPager optimized

        		_$("#backBar").style.display = 'block';
                self.content.parentNode.style.top = TOOL_BAR_HEIGHT + 'px';
                self.tabBar.style.top = '0px';
                   
                mngDownloader.start(cvCurName);
               
            };
            
            eMagReader.unLoadData_i =  eMagReader.unLoadData;
            eMagReader.unLoadData = function() {
            	eMagReader.unLoadData_i();
            	mngDownloader.stop(cvCurName);
            };
        }        

        eMagReader.startup();        
    };

    function processCommand(pCommand, pAddInfo) {
    	var frameUrl = "main/", action = null;
        switch (pCommand.split('-')[0]) {
        case "EMAG":
        	initCases();
        	return;
        case "NEWS_FEED":
            frameUrl += "twitter.htm";
            action = function() {
            	loadRSS(mngSettings[pCommand].RSS_LINK, pAddInfo);
            };            
            break;
        case "STATIC":
            if (parseInt(mngSettings[pCommand].OPEN_INAPP))
                self.openUrl(mngSettings[pCommand].STATIC_LINK, !mngSettings[pCommand].USE_NAVBUTTONS);
            else
                top.open(mngSettings[pCommand].STATIC_LINK, '_blank');
            return;
        case "EMAIL":
        	window.location.href = 'mailto:' + mngSettings[pCommand].ADDRESS + '?subject=' + mngSettings[pCommand].SUBJECT;
            return;
        case "STATIC_PIC":
            frameUrl += "picture.htm";
            action = function() {
                    loadImagePage(pCommand);
            };
            break;
        }

        loadContent(frameUrl, action, pCommand);
    }
    
    function onTabSwitch(e) {
        var command = e.currentTarget.getAttribute("id").substr(5),
            vType = command.split('-')[0];
        $log.info("COMMAND: " + command);
    	if ($dom.hC(e.target.parentNode, "selected")) 
    		return;
    	
    	// handle selection
    	if ((vType !== 'STATIC') && (vType !== 'EMAIL')) 
    		updateSelectedTab(e.target);
    		                 
    	processCommand(command);
    }
    
    function updateSelectedTab(pNewSelected) {
    	var oldSelection = _$("#tabsControl .selected>DIV", null, true);
    	$dom.rC(oldSelection.parentNode, "selected");
    	$dom.aC(pNewSelected.parentNode, "selected");    	
    	$dom.rc(oldSelection, 'down', 'up');
    	$dom.rc(pNewSelected, 'up', 'down');
    }

    function getStaticImage() {
    	return _$('IMG.static', self.content, true);
    }
    
    var cvResizeImageTimeout;
    function resizeImagePage(pCommand, pImg) {
    	if (!pImg) {    	
    		pImg = getStaticImage();    		
    		if (pImg) {
                pCommand = pCommand || _$("#tabsControl .selected", null, true).id.replace('cpTab', '');
    			var vPath = mngSettings[pCommand][(innerWidth > innerHeight ? 'LANDSCAPE_URL': 'PORTRAIT_URL')];
                  
                    $log.info('STATIC PIC UPDATE: ' + vPath);
                    if (!vPath) {
                        clearTimeout(cvResizeImageTimeout);
                        cvResizeImageTimeout = setTimeout(resizeImagePage, 1000, pCommand);
                        return;
                    }
                    
    			if (pImg && (pImg.src != vPath)) {
    				pImg.style.height = pImg.style.width = '';
    				pImg.src = vPath;    		
    			}
    		}
    		return;
    	}

        var vRate = Math[innerWidth <= pImg.origWidth ? 'min': 'max'](innerWidth / pImg.origWidth, 1),
            vWidth = Math.round(pImg.origWidth * vRate),
            vHeight = Math.round(pImg.origHeight * vRate);        
        
        $dom.size(pImg, vWidth, vHeight);
        pImg.parentNode.parentNode._scrollHeight = vHeight;

        $dom.show(pImg);
        setTimeout(function() {
        	self.updateScroll();	
        }, 300);
        
    }

    function loadImagePage(pCommand) {
        var vImg = getStaticImage();
        if (!vImg) {
            showAlert('Error!', 'Internal error occured, page can\'t be opened.', 'OK');
        	return ;
        }
        
        $dom.hide(vImg);
        self.content.parentNode.style.background = vImg.style.backgroundColor;
        vImg.addEventListener('load', function (e) {
            this.origWidth = this.width;
            this.origHeight = this.height;
            this.addEventListener('click', function(e) {
                self.openUrl(mngSettings[pCommand].LINK);
            });
                              
            resizeImagePage(pCommand, this);
        }, false);

        resizeImagePage(pCommand);
    }

    function getThumbnailList() {
        var vResult = [];
        for (var i = 0; i < cvEMags.length / 2; i++) {
            vResult.push(cvEMags[i * 2]);
            vResult.push(cvEMags[i * 2 + 1] + '/pubData/source/images/' + ($ua.iP() ? ($ua.iPad() ? 'ipad/images/' : 'iphone/images/') : '') + 'pages/page1.jpg');
        }        
        return vResult;
    }    
    
    function createDownloadThread(pIndex, pImgDir) {
        var vDir = pImgDir.replace('pages/page1.jpg', ''); 
        	
        mngDownloader.createThread(cvEMags[pIndex * 2], 
            [
             	vDir + 'pages/page<~Index~>.jpg',
             	vDir + 'thumbnails/thumbnail<~Index~>.jpg',
             	vDir + 'zoompages/zoompage<~Index~>.jpg'
            ], cvEMags[pIndex * 2 + 1] + '/pubData/config/reader_json.xml'
        );        
    }
					
	function additionalInits(pCell, pList, pIndex, pWidth) {
			createDownloadThread(pIndex, pList[pIndex * 2 + 1]);	
					
			if (!appConfig.customPreload)
				return;
										
            var vPrlBtn = document.createElement('p');
                vPrlBtn.id = 'btnPreload';
                vPrlBtn.innerText = 'Download';
                    //$dom.move(vPrlBtn, Math.floor(pWidth / 2) - Math.floor(pWidth * 0.7 / 2), 15);
                    
            vPrlBtn.style.left = -(pWidth * 0.7) / 2 + 'px';
            $dom.size(vPrlBtn, pWidth * 0.7, 20);
                    
            pCell.preloader = document.createElement('div');
            pCell.preloader.style.position = 'relative';
            pCell.preloader.style.left = '50%';
            pCell.preloader.appendChild(vPrlBtn);
                    
                    //pCell.appendChild(vPrlBtn);
                    //pCell.preloader = vPrlBtn;
					
            vPrlBtn.suspended = true;
            vPrlBtn.eMagName = pList[pIndex * 2];
            //UPD
            self.mngDownloader = mngDownloader;
            
            var vEvent = function(e) {
            	if (!appConfig.accessStatus) {
            		return mngSecurityApp.show(undefined, vPrlBtn);
            		
            	} 
                 e.stopPropagation();
                 e.preventDefault();

                 if (vPrlBtn.completed)
                     return;
                    
                 if (vPrlBtn.suspended && !isConnected()) {
                     showAlert('Information', 'Internat connection is not avilable.', 'OK');
                     return;
                 }
                    
                 if (vPrlBtn.corrupted) {
                    showAlert('Information', 'The publication data file is unavailable.', 'OK');
                    return;
                 }
                    
                 vPrlBtn.suspended = !vPrlBtn.suspended;
                 vPrlBtn.innerText = (vPrlBtn.suspended ? 'Download': 'Stop');
                 
                 self.mngDownloader[vPrlBtn.suspended ? 'stop': 'start'](vPrlBtn.eMagName, !vPrlBtn.suspended);        
            };
       
            vPrlBtn.addEventListener('click', vEvent, false);
            setTimeout(function() {
                 _$('canvas', pCell).addEventListener('click', vEvent, false);
            }, 100);
            		
			var vStatusCheck = function (pPrl) {
				var vThread = mngDownloader.getThread(pPrl.eMagName);
				if (vThread) {
					if (vThread.completed) {
						clearInterval(pPrl.timerID);
						pPrl.innerText = 'Downloaded';
						pPrl.completed = true;
					} 
										
                    pPrl.corrupted = vThread.corrupted;
					pPrl.style.backgroundSize = vThread.progress + '%';
				}
			};
					
            vPrlBtn.timerID = setInterval(vStatusCheck, 3000, vPrlBtn);					
            setTimeout(vStatusCheck, 0, vPrlBtn);					
	}

    function init2DCoverFlow(pElm, pList) {
        var vTDTmpl = document.createElement('td'),
            vCellTmpl = document.createElement('div'),
            vImgTmpl = document.createElement('div'),
            vCnvTmpl = document.createElement('canvas'),
            vCell, vPrl, vImg, vCnv, vCFP = cCoverFlow.prototype;

        $dom.aC(vCellTmpl, 'cellDiv');
        pElm.innerHTML = '<table cellpading="10"><tr id="trContainer"></tr></table>';
        var vCnt = _$('#trContainer', pElm, true),        	
            vTbl = _$('table', pElm, true),
            vTitle = _$('#cflow>.title', null, true),            
            vRate = (innerHeight * 0.6) / vCFP.getImageSize('Height'),
            vWidth = vCFP.getImageSize('Width') * vRate,
            vHeight = vCFP.getImageSize('Height') * vRate;

        vCnvTmpl.style.top = vHeight + /*(appConfig.customPreload ? 20: 0) + */ 'px';
        vTbl.style.left = -vWidth / 2 + 'px';
        vTbl.style.top = Math.floor(Math.floor(
        	vCFP.getWrapperSize('Height') - vCFP.getImageSize('Height')) / 2) + 'px';
        
        $dom.size(vImgTmpl, vWidth, vHeight);
        $dom.size(vCellTmpl, Math.max(vCFP.getPageSize('Width') / 2, vWidth * 1.5), vCFP.getWrapperSize('Height'));
        $dom.size(pElm.parentNode, vCFP.getPageSize('Width'), vCFP.getPageSize('Height'));
        pElm.parentNode.style.overflow = 'hidden';
        pElm.style.height = vCFP.getPageSize('Height') + 'px';

        var vCells = [];
        for (var i = 0; i < pList.length / 2; i++) {
            vCell = vCellTmpl.cloneNode(true);            
            vImg = vImgTmpl.cloneNode(true);
			vCnv = vCnvTmpl.cloneNode(true);				
         
			additionalInits(vCell, pList, i, vWidth);
							
			vCells[i] = vCell; 
            vCell.appendChild(vCnv);
            vCell.appendChild(vImg);            
            vCnt.appendChild(vTDTmpl.cloneNode(true).appendChild(vCell).parentNode);
            vImg.index = i;
            vImg.addEventListener('click', function() {
            	cvCoverFlow.onclick(this.index);
            }, false);            
                        
            setTimeout(function (pURL, pImg) {
            	pImg.style.backgroundImage = 'url(main/img/load.gif)';
            	pImg.style.backgroundRepeat = 'no-repeat';
            	pImg.style.backgroundPosition = 'center';

                _$p(pURL, function (pObj, pPath) {
                	$dom.p(pImg, pPath, null, function (pObj) {
                		pObj.loaded = true;
                		pObj.path = pPath;
                		pObj.style.backgroundPosition = 'bottom center';
                        pObj.style.backgroundSize = 'contain';
                		vCFP.reflect(pObj, vWidth, vHeight, _$('canvas', pObj.parentNode, true));
                	});
                	//pImg.src = ($ua.isTouch() ? pPath: pURL);
                },  function(pMsg) {
                	$log.error('Preview load error: ' + pMsg);
                });
            }, 200 * i, pList[i * 2 + 1], vImg);
        }        

        pElm.parentNode._scrollWidth = (pList.length / 2 + 3) * vWidth * 1.5;
        cvCoverFlow = new csc(pElm, true, false, true);
        cvCoverFlow.touchStart = function (e, ctr) {
            ctr.stt(0); //setTransitionTime optimized 
            ctr.invoke('setScrollStart');
            ctr.invoke('setTouchStart', e);

            cvCoverFlow.timeStart = e.timeStamp;
        };
        cvCoverFlow.touchMove = function (e, ctr) {
            if (cvCoverFlow.timeStart) {
                cvCoverFlow.moved = true;
                ctr.setPos(ctr.invoke('getMovePos', e));
                ctr.invoke('setTouchStart', e);
            }
        };
        cvCoverFlow.touchEnd = function (e, ctr) {
            if (cvCoverFlow.moved) {
                var vLast = cvPosition;
                cvPosition = Math.min(Math.max(ctr.invoke('getLey', e.timeStamp - cvCoverFlow.timeStart > 500 ? vCFP.getPageSize('Width') / 3 : 0)[0] + (cvPosition || 1), 1), pList.length / 2);

                if ((vLast != undefined) && (vLast != cvPosition)) cvCoverFlow.onScrollEnd();

                ctr.stt('350ms'); //setTransitionTime optimized    				
                ctr.setPos([(-cvPosition + 1) * Math.max(vCFP.getPageSize('Width') / 2, vWidth * 1.5), 0]);
                cvCoverFlow.timeStart = null;
                cvCoverFlow.moved = false;
            } 
            else
            	$dom.dispatchClick(e);
//            	cvCoverFlow.onClick(cvPosition - 1);
        };

        cvCoverFlow.onScrollEnd = function () {
        	var vIndex = (cvPosition - 1);
            vTitle.innerHTML = '<p>' + pList[vIndex * 2] + '</p>';
            if (isConnected() && vCells[vIndex]) {            	
            	var vCW = parseInt(vCells[vIndex].preloader.style.width);
            	if (vTitle.offsetWidth > vCW)
            		vCells[vIndex].preloader.style.left = Math.floor(vTitle.offsetWidth / 2 - vCW / 2) + 'px';
            	vTitle.appendChild(vCells[vIndex].preloader);
            }
            vTitle.style.left = innerWidth / 2 - vTitle.offsetWidth / 2 + 'px';
            vTitle.style.top = '80%';
        };

        cvCoverFlow.invalidate = function () {
            var vColl = _$('.cellDiv', pElm, true, true);
            
            vRate = (innerHeight * 0.6) / vCFP.getImageSize('Height');
            vWidth = vCFP.getImageSize('Width') * vRate;
            vHeight = vCFP.getImageSize('Height') * vRate;
            vTbl.style.left = -vWidth / 2 + 'px';
            vTbl.style.top = Math.floor(Math.floor(
            	vCFP.getWrapperSize('Height') - vCFP.getImageSize('Height')) / 2) + 'px';

            for (var i = 0; i < vColl.length; i++) {
                var vCanvas = _$('canvas', vColl[i], true),
                    vImage = _$('div', vColl[i], true),
                    vPrl = _$('p', vColl[i], true);
                
                if (vPrl) {
                	$dom.move(vPrl, Math.floor(vWidth / 2) - Math.floor(vWidth * 0.7 / 2), -15);
                	$dom.size(vPrl, vWidth * 0.7, 20);
                }
                                
                vCanvas.style.top = vHeight + /*(appConfig.customPreload ? 20: 0) +*/ 'px';
                $dom.size(vImage, vWidth, vHeight);
                $dom.size(vColl[i], Math.max(vCFP.getPageSize('Width') / 2, vWidth * 1.5), vCFP.getWrapperSize('Height'));
                $dom.size(pElm.parentNode, vCFP.getPageSize('Width'), vCFP.getPageSize('Height'));
                if (vImage.loaded)
                	vCFP.reflect(vImage, vWidth, vHeight, vCanvas);
            }

            vTitle.style.left = innerWidth / 2 - vTitle.offsetWidth / 2 + 'px';
            pElm.parentNode._scrollWidth = (pList.length / 2 + 3) * vWidth * 1.5;

            cvCoverFlow.refresh(false, [(-cvPosition + 1) * Math.max(vCFP.getPageSize('Width') / 2, vWidth * 1.5), 0]);
        };

        cvCoverFlow.refresh();
        cvCoverFlow.onScrollEnd();
    }

    function init3DCoverFlow(pElm, pList) {
        cvCoverFlow = new cCoverFlow(pElm);
        cvCoverFlow.load(pList, additionalInits);
    }

    function setupCaseHandlers() {
        $log.info('setup cases event handlers');

        self.content.parentNode.style.background = '#b6c8cf';
        var vElm = _$('#tray', self.content, true),
            vList = getThumbnailList();

        if ($wkit.has3d && ($ua.iP() /*|| (parseInt(device.version) > 3)*/)) 
        	init3DCoverFlow(vElm, vList);
        else 
        	init2DCoverFlow(vElm, vList);
        
        self.coverFlowAction = cvCoverFlow.onclick = function(pIndex) {
        	if (!appConfig.accessStatus) {
        		return mngSecurityApp.show(pIndex);
        	}
     	   
        	if (cvReaderLock)
             	return;
         	
     	   cvReaderLock = true;
     	   var vUrl = cvEMags[pIndex * 2 + 1];            

     	   cvImgDir = vUrl + "/pubData/source/images/";
     	   cvDataURL = vUrl + "/pubData/config/reader_json.xml";
     	   cvCurName = cvEMags[pIndex * 2];
		
     	   _$("#backBar>H1>marquee").innerText = cvEMags[pIndex * 2];    
		 
     	   self.showPreloader(true);
		 
     	   _$p(cvDataURL, function (pObj, pPath) {
     		   var vThread = mngDownloader.getThread(cvCurName);
     		   if (!isConnected() && !vThread.completed)
     			   showAlert('Information', 'The publication is not completely downloaded. Some pages will be not accessible.', 'OK');      
     		   loadContent('reader/index.htm', setupViewer, 'Reader', true);
     	   }, function() {
     		   if (isConnected())
     			   showAlert('Information', 'The publication data file is unavailable.', 'OK');
     		   else
     			   showAlert('Information', 'This publication can\'t be opened in offline mode.', 'OK');
		     
     		   cvReaderLock = false;
     		   self.showPreloader(false);
     	   });
        }
        
       /*function cvCoverFlowAction(pIndex, callback) {
    	   
        };
        self.coverFlowAction = cvCoverFlowAction;*/

        cvCoverFlow.element = _$('#cflow', self.content, true);
    }

    function updateContent(result, action, actionBefore) {
        if (actionBefore) action(result);
        else {
            self.content.innerHTML = result;

            if (action) {
                $log.info('exec action');
                action.call();
            }
        }
        self.updateSize();
        self.showPreloader(false);
    }

    function loadContent(url, action, command, actionBefore) {
        self.showPreloader(true);
        try {
            $log.info('opening ->' + url);
            if (command && cvCache[command]) {
                updateContent(cvCache[command], action, actionBefore);
                $log.info('loading from cache ' + command);
            } else {
                _$get(url, function (result) {
                    if (command) {
                        cvCache[command] = result;
                    }                    
                    updateContent(result, action, actionBefore);
                }, function (error) {
                    self.showPreloader(false);
                    $log.info("ERR->" + error + "=>" + url);
                });
            }
        } catch (e) {
            $log.info(e);
        }
    }

    function initCases() {
        self.content.parentNode.style.background = '#b6c8cf';
        self.content.parentNode.style.top = '0px';
        //self.tabBar.style.top = innerHeight - TOOL_BAR_HEIGHT + 'px';
        
    	self.tabBar.style.top = 
    		self.content.parentNode.style.height = 
        		innerHeight - TOOL_BAR_HEIGHT + "px";        

        if (cvCoverFlow) {
            self.content.innerHTML = '';
            self.content.appendChild(cvCoverFlow.element);
            cvCoverFlow.invalidate();            
        } else        	
        	loadContent('main/cases.htm', setupCaseHandlers, 'Cases');
    }
    

    document.addEventListener('deviceready', deviceready, false);
})();