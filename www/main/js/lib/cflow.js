function cCoverFlow(pElm) {
	var self = this,
		cvStartX,	
		cvLastX,
		cvCurrentX = 0,
		cvLastMoveTime,
		cvLastIndex = 0,
		cvCache = {},
	    cvCells = [],
		cvTitles = [],
		cvEventHandlers = {},
	    cvTitle = _$('.cflow div.title', null, true);
 
	self.touchStart = function (e)
	{						
		cvStartX = getPosition(e) - cvCurrentX;		
	};

	self.touchMove = function (e)
	{
		if (cvStartX) {		
			cvLastMoveTime = new Date();
			cvLastX = cvCurrentX = getPosition(e) - cvStartX;
			update();							
		}
	};

	self.touchEnd = function (e)
	{
		if (!cvStartX) return;				
				
		if (cvLastX) {
			cvCurrentX = cvCurrentX + 
				(cvCurrentX - cvLastX) * 200 / 
				((new Date) - cvLastMoveTime + 1);
			cvLastIndex = self.curIndex;
			cvCurrentX = -cvLastIndex * getGap(); 
			update("0.4s");
		}
		else
			$dom.dispatchClick(e);
		//self.onClick(self.curIndex);
		
		cvStartX = null;
		cvLastX  = null;
	};

	self.handleEvent = function (e)
	{
		e.preventDefault();
		e.stopPropagation();
		
		(self[cvEventHandlers[e.type]] || $log.fatal)(e);
	};
	
	self.onClick = function(pIndex)
	{
		var cell = cvCells[pIndex];

		if (cell.focused)
			transform += " translate3d(0, 0, 150px) rotateY(180deg)";
		setTransformForCell(cell, pIndex);
	};	
	
	function getXGap() {
		if (!cvCache.xgsz)
			cvCache.xgsz = getGap() / 3;
		
		return cvCache.xgsz;
	}
	
	function getGap() {
		if (!cvCache.gsz)
			cvCache.gsz = self.getWrapperSize('Width') / 3;		
		
		return cvCache.gsz;
	}

	function getPosition(e) {
		return ($ua.isTouch() ? e.changedTouches[0] : e).pageX;
	}
	
    function appointListeners(list) {
        for (var i = 0; i < list.length; i++) {
        	cvEventHandlers[list[i * 2]] = list[i * 2 + 1];
            pElm.addEventListener(list[i * 2], self, false);
        }
    }	

	function transformForCell(pCell, pIndex)
	{
		pCell.style.zIndex = self.curIndex > pIndex ? pIndex : 100 - pIndex;
		var vPos = (pIndex * getGap()),
			vShift = cvCurrentX + vPos,
			vFlowLand = getGap() / 2;
		
		if ((vShift < vFlowLand) && (vShift >= -vFlowLand))
			return "translate3d(" + vPos + "px, 0, " + getGap() + "px)";
		else 
		{
			var vSign = (vShift > 0 ? 1: -1);
			return _$sbt("translate3d({0}px, 0, 0) rotateY({1}deg)", 
				[vPos + (vSign * getXGap()), vSign * (-70)]);
		}		
	}

	function setTransformForCell(pCell, pIndex, pFocused)
	{
		pCell.focused = pFocused;
		pCell.style.webkitTransform = 
			transformForCell(pCell, pIndex);
	}

	function update(pTime)
	{				
		pElm.style.webkitTransitionDuration = pTime || '0ms'; 
		pElm.style.webkitTransform =
			_$sbt($wkit.gTT(), [cvCurrentX, 0]);
		
		setTimeout(function() {
			var vCurIndex = self.curIndex;
			for (var i = 0; i < cvCells.length; i++)
				setTransformForCell(cvCells[i], i, i == vCurIndex);
			
			cvTitle.innerHTML = '<p>' + cvTitles[vCurIndex] + '</p>';
            if (cvCells[vCurIndex] && cvCells[vCurIndex].preloader)
                   cvTitle.appendChild(cvCells[vCurIndex].preloader);
            setTimeout(function() {
                   cvTitle.style.top = ($ua.iPad() ? '85': '80') + '%';
                   cvTitle.style.left = innerWidth / 2 - cvTitle.offsetWidth / 2 + 'px';
            }, 100);
		}, 0);		
	}
	
    self.__defineGetter__('position', function () {
        return cvCurrentX;
    });
    self.__defineSetter__('position', function (pValue) {
    	cvCurrentX = pValue;
    	update();
    }); 	
    self.__defineGetter__('curIndex', function () {    	
    	return Math.min(Math.max(-Math.round(cvCurrentX / getGap()), 0), cvCells.length - 1);
    });      
    
    self.invalidate = function() {
    	cvCache = {};
    	for (var i = 0; i < cvCells.length; i++)
    		updateSize(cvCells[i]);
    	
    	cvCurrentX = -cvLastIndex * getGap();    	
    	update();
    };
    
    function updateSize(pCell) {
		
		var vImg = _$('div.image', pCell);
		if (!vImg) return;
		
		var	vCanvas = _$('canvas', pCell);
		
		vWidth = self.getImageSize('Width');   //!!in case the same dimensions
		vHeight = self.getImageSize('Height');

		$dom.transparent(pCell);
		
		if(pCell.preloader) {
			var vGap = self.getWrapperSize('Height') - vHeight - 50,
			vPrlHeight = Math.min(20, vGap - 6);
			//$dom.move(pCell.preloader, Math.floor(self.getPageSize('Width') / 2), self.getWrapperSize('Height') / 12);
			$dom.size(pCell.preloader, vWidth * 0.7, vPrlHeight); 
		}
	
		$dom.size(pCell, self.getWrapperSize('Width'), self.getWrapperSize('Height'));
		$dom.move(pCell, Math.round(-self.getWrapperSize('Width') / 2), Math.round(-self.getWrapperSize('Height') / 8));		

		$dom.size(vImg, vWidth, vHeight);
        if (vImg.path)
            vImg.style.webkitBackgroundSize = vWidth + 'px ' + vHeight + 'px';
		var vPos = Math.round((self.getWrapperSize('Width') - vWidth) / 2);
		$dom.move(vImg, vPos, self.getWrapperSize('Height') - vHeight);
		$dom.move(vCanvas, vPos, self.getWrapperSize('Height'));
		self.reflect(vImg, vWidth, vHeight, vCanvas);
		
		$dom.transparent(pCell, '1');
    }
    
    function showPreview(pImg, pPath) {
        pImg.style.backgroundImage = 'url("' + pPath + '")';
        pImg.path = pPath;
        
        updateSize(pImg.parentNode);
    }
    
    function checkPreloadProcess() {
        if (cvPreloadQueue.length > 0) {
            var vObj = cvPreloadQueue.pop();
            setTimeout(uploadPreview, 1000, vObj.path, vObj.img);
        }
    }
    
    function uploadPreview(pURL, pImg) {
        _$p(pURL, function (pObj, pPath) {
                setTimeout(showPreview, 1000, pImg, pPath);
                checkPreloadProcess();
            }, function(pURL) {
                showPreview(pImg, 'main/img/unavailable.png');
                checkPreloadProcess();
        });
    }
    
    var cvPreloadQueue = [];
	function preload(pList, pIndex, pCustomInit) {		
		var cell = document.createElement("div"),
			image = document.createElement("div"),
			canvas = document.createElement("canvas");
		
		if (pCustomInit)
            pCustomInit(cell, pList, pIndex, self.getImageSize('Width'));
		
        image.className = "image";
		cell.className = "cell";
	
		setTransformForCell(cell, cvCells.length);
		cvCells.push(cell);
		pElm.appendChild(cell);
        cell.appendChild(image);
		cell.appendChild(canvas);
	
		image.index = pIndex;
		image.addEventListener('click', function(e) {
			self.onClick(this.index);
		});


        if (pIndex <= 2)
            setTimeout(uploadPreview, 1000 * (pIndex + 1), pList[2 * pIndex + 1], image);
        else
            cvPreloadQueue.push({path: pList[2 * pIndex + 1], img: image});
        updateSize(cell);
	}    
    
	self.load = function (pList, pCustomInit) {
		for (var i = 0; i < pList.length / 2; i++) {
			cvTitles[i] = pList[i * 2];			
			preload(pList, i, pCustomInit);				
		}	

		update();

	    appointListeners([
               ($ua.isTouch() ? 'touchstart' : 'mousedown'), 'touchStart', 
               ($ua.isTouch() ? 'touchmove' : 'mousemove'), 'touchMove', 
	           ($ua.isTouch() ? 'touchend' : 'mouseup'), 'touchEnd', 
	    ]);
       
	};
		
	return self;
};

var cCFP = cCoverFlow.prototype;
cCFP.getImageSize = function(pDimention) {
	return this.getWrapperSize(pDimention) * 3 / 4; 
};

cCFP.getWrapperSize = function(pDimention) {
	var h = this.getPageSize('Height') * 2 / 3; 
	return {
		Width: h * 2 / 3,
		Height: h
	}[pDimention];    	
};

cCFP.getPageSize = function(pDimention) {
	return window['inner' + pDimention];
};

cCFP.reflect = function(image, iwidth, iheight, canvas)
{
    if (!image.path)
        return;
    
	canvas.width = iwidth;
	canvas.height = iheight / 2;

	var ctx = canvas.getContext("2d");

	ctx.save();

	ctx.translate(0, iheight - 1);
	ctx.scale(1, -1);
    
    var vIC = document.createElement('img');
    vIC.addEventListener('load', function(e) {
                         ctx.drawImage(this, 0, 0, iwidth, iheight);

                         ctx.restore();

                         ctx.globalCompositeOperation = "destination-out";

                         var gradient = ctx.createLinearGradient(0, 0, 0, iheight / 2);
                         gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
                         gradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");

                         ctx.fillStyle = gradient;
                         ctx.fillRect(0, 0, iwidth, iheight / 2);
                         
                         this.removeEventListener('load', arguments.callee.caller);
                         vIC = null;
                         delete vIC;
    });
    vIC.src = image.path;
};