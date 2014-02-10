/*
  Support Operations
 */

function cDownloadThread(pLinks, pDataURL) {
	var self = this,
    cvSuspended = true,
    cvLinkCount = pLinks.length,
    cvLinkIndex = 0,
    cvTotalIndex = 1,
    cvErrorCount = 0,
    cvPageCount;
	
	self.locked = false;
    self.__defineGetter__('corrupted', function() {
           return !cvPageCount;
    });
    
	self.__defineGetter__('completed', function() {
          return (lStorage.getItem(pLinks[0]) || (cvTotalIndex > cvPageCount));
    });
	
	self.__defineGetter__('progress', function() {
        if (self.completed)
          return 100;
        else
          return Math.floor(100 / (cvPageCount * cvLinkCount) * ((cvTotalIndex - 1) * cvLinkCount + cvLinkIndex));
    });
	
	self.__defineGetter__('suspended', function() {
        return cvSuspended;
    });
	
	self.__defineSetter__('suspended', function(pValue) {
       if (self.locked || (cvSuspended == pValue))
          return;
                        
          cvSuspended = pValue;
       if (!cvSuspended)
          setTimeout(process, 0);
    });
	
	function process() {
		if (cvSuspended || self.completed || !eMagPromo.isConnected())
			return;
        
		if (cvLinkIndex >= cvLinkCount) {
			if (++cvTotalIndex > cvPageCount)
				try {
					lStorage.setItem(pLinks[0], true);
				} catch (e) {
					$log.warn('SO ERROR: ' + e.message);
				}
			setTimeout(process, 100, cvLinkIndex = 0);
		}
		else {
			_$p(pLinks[cvLinkIndex].replace('<~Index~>', cvTotalIndex),
    			function () {
                    cvLinkIndex++;
                    setTimeout(process, 100);
				}, function() {
                    if (++cvErrorCount < 5)
                        setTimeout(process, 100);
                    else
                        cvPageCount = cvTotalIndex - 1;
				}
            );
		}
	}
    
	_$p(pDataURL,
        function (pObj, pPath) {
            try {
                cvPageCount = (top.JSON || EM.U.S).parse(_$get(pPath)).pages.length;
            } catch(e) {
                $log.error('SO:Downloader data JSON parse error.');
            }
        }, function() {
            $log.error('SO:Downloader page count determinate error.');
        }
    );
	
	
	return self;
}

function cDownloadManager() {
	var self = this,
    cvThreads = {};
    
	self.createThread = function(pName, pLinks, pDataURL) {
		cvThreads[pName] = new cDownloadThread(pLinks, pDataURL);
	};
	
	self.start = function(pName, pLocked) {
		var vThread = cvThreads[pName];
		
		vThread.suspended = false;
		if (pLocked != undefined)
			vThread.locked = pLocked;
	};
    
	self.stop = function(pName, pLocked) {
		var vThread = cvThreads[pName];
		
		if (pLocked != undefined)
			vThread.locked = pLocked;
		vThread.suspended = true;		
	};
	
	self.getThread = function(pName) {
		return cvThreads[pName];
	};
	
	return self;
}