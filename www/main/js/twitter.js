var TWEETER_ID = "eMagCreator";

function checkConnection(callBack) {
	eMagPromo.showPreloader(true);
	$log.info('check network reachability' + navigator.network);
	var networkState = navigator.network.connection.type;
	$log.info('network state ->' +networkState);	
	if (networkState == Connection.NONE){
		navigator.notification.confirm('There was an error connecting to the Internet. Would you like to retry?.',
				function(buttonIndex) {
			$log.info('btn ->'+buttonIndex);
			if (buttonIndex == 2){			
				callBack();
			}
			else{				
				eMagPromo.showPreloader(false);
			}
		},
		'No network connection', 'NO,YES'
		);
		return false;
	}
	return true;
}

function loadRSS(pLink, pShowLast) {
	if (!checkConnection(loadRSS))
		return;

	_$get(pLink, function(pData) {
		var vList = new RSS2Channel(pData),
			vResult = [];

        for (var i = 0; i < Math.min(vList.items.length, 20); i++) {
          var vDate = vList.items[i].pubDate.split(' '), vMonth = vDate[2], vDay = vDate[1], vYear = vDate[3];
          vResult.push('<li><i>' + vDay + ' ' + vMonth + ' ' + vYear + '</i><span><a target="_parent" href="javascript:eMagPromo.openUrl(\'' + vList.items[i].link + '\');">' + vList.items[i].title + '</a></span></li>');
        }
		_$('#scroll', eMagPromo.content, true).innerHTML = '<ul class="jUL">' + vResult.join('') + '</ul>';
		
		eMagPromo.updateSize();
		eMagPromo.showPreloader(false);
		
		if (pShowLast)
			eMagPromo.openUrl(vList.items[0].link);
	}, function (pStatus) {
		$log.error('RSS Load Error (Status: ' + pStatus + ')');
		alert('There was error occurred while news loading.');
	}, undefined, true, 'get', true);
}

function loadTweets() {
	if (!checkConnection(loadTweets))
		return;
	
	try {
		getTwitters(
			_$('#scroll', eMagPromo.content, true),
			{
				id : TWEETER_ID,
				count : 20,
				enableLinks : false,
				ignoreReplies : true,
				clearContents : true,
				template : '<i>%time%</i><span><a target="_parent" id="%id_str%" href="#">%text%</a></span> ',
				callback : onTweetsLoaded
			});
	} catch (e) {
		$log.error('getTwitters: ' + e.message);
	}
}

function onTweetsLoaded() {
	$log.info('onTweetsLoaded call');

	var vLinks = _$('A', eMagPromo.content, true, true);
	for (var i = 0; i < vLinks.length; i++)
		vLinks[i].addEventListener('click', tweetClick)
	
	var vWrapper = _$('#wps', eMagPromo.content, true);
	vWrapper._scrollHeight = vWrapper.scrollHeight + 70;
	
	eMagPromo.updateSize();
	eMagPromo.showPreloader(false);
}

function tweetClick() {
	eMagPromo.showPreloader(true);
	eMagPromo.openUrl("http://twitter.com/" + TWEETER_ID + "/status/" + this.id);	
	eMagPromo.showPreloader(false);
}