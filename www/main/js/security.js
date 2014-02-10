function cSecurityManagerApp(pOwner) {
	var self = new cSecurityManager({mb: {settings: {}}}),
		cvsecurityStatus = false,
		cvPortalAccessProtection = "PortalAccessProtection",
		vAPwindow =  _$("#scrAP"),
		vAcProtectionDiv = _$('#acProtection'),
		vBackBtn = _$('.button_back'),
		vSubmitBut = _$('#Submit', vAcProtectionDiv),
		vLoginInput = _$('input[type=text]', vAcProtectionDiv),
		vPassInput = _$('input[type=password]', vAcProtectionDiv),
		vErrorMessage = _$('.errorMessage', vAcProtectionDiv);
	
	function tooggleLogin(elem) {
		if (appConfig.accessStatus)
    		$dom.hide(elem);
    	else {
    		$dom.show(elem)
    		elem.onclick = function() {
    			self.show(undefined);
    		}
    	}
    	
    }
	
	function addFocusInput() {
		for (var i=0; i < arguments.length; i++) {
			arguments[i].onclick = this.focus();
		}
	};
	
	function hideAPwindow() {
		$dom.hide(_$("#scrAP"));
    	$dom.hide(_$('.errorMessage'));
    	$dom.show(_$("#tabsControl>UL"));
    	vLoginInput.value = '';
    	vPassInput.value = '';
    	vLoginInput.placeholder = eMagReader.loc('accessProtectionCredentialsFormLogin', null, 'accessprotection_plugin');
		vPassInput.placeholder = eMagReader.loc('accessProtectionCredentialsFormPassword', null, 'accessprotection_plugin');
	}
	
	function checkEmptyInput() {
		checkEmptyInput.empty = false;
		for (var i = 0; i < arguments.length; i++) {
			if (!arguments[i].value) {
				checkEmptyInput.empty = true;
				vErrorMessage.innerHTML = arguments[i] == vLoginInput ? vErrorMessage.innerHTML = eMagReader.loc('accessProtectionNoLogin', null, 'accessprotection_plugin') : 
					eMagReader.loc('accessProtectionNoPassword', null, 'accessprotection_plugin');
				$dom.show(vErrorMessage);
			} 
		}
	}
	
	
	self.checkSecurityStatus = function() {
		if (pOwner.isConnected()) {
			self.getFromPortalBeta($soap.createRequest("urn:Webservices" + cvPortalAccessProtection, 'checkExistanceByApp', {"app_id" : $soap.createField("string", APP_ID)}),
					'checkExistanceByApp',
					function(pData) {
						cvsecurityStatus = +$soap.getFieldValue(pData, 'exists') ? true : false;
						if (!cvsecurityStatus) {
							appConfig.accessStatus = true;
							return tooggleLogin(_$('#testLogin'));	
						}
						lStorage.setItem('message', $soap.getFieldValue(pData, 'message'))
						lStorage.setItem('profile_id', $soap.getFieldValue(pData, 'profile_id'));
					});	
			if (lStorage.getItem('lastValidLogin') && lStorage.getItem('lastValidPassword')) {
				self.getFromPortalBeta($soap.createRequest("urn:Webservices" + cvPortalAccessProtection, 'checkPassword', {
						"profile_id" : $soap.createField("string", lStorage.getItem('profile_id')),
						"login" : $soap.createField("string", lStorage.getItem('lastValidLogin')),
						"password" : $soap.createField("string", lStorage.getItem('lastValidPassword'))}), 
						'checkPassword',						
						function(pData) {
							cvsecurityStatus = +$soap.getFieldValue(pData, 'exists') ? true : false;
							tooggleLogin(_$('#testLogin'))
						});
			}	
			
		} else 
			appConfig.accessStatus = false; 
		
		tooggleLogin(_$('#testLogin'));
	};
	
	self.show = function(pIndex, pPrlBtn) {
		$dom.show(vAPwindow);
		$dom.hide(_$("#tabsControl>UL"));
		vBackBtn.onclick = hideAPwindow;
		
		vSubmitBut.innerHTML = eMagReader.loc('accessProtectionCredentialsFormSubmit', null , 'accessprotection_plugin');
		vBackBtn.innerHTML = eMagReader.loc('accessProtectionBack', null , 'accessprotection_plugin');
		vLoginInput.placeholder = eMagReader.loc('accessProtectionCredentialsFormLogin', null, 'accessprotection_plugin');
		vPassInput.placeholder = eMagReader.loc('accessProtectionCredentialsFormPassword', null, 'accessprotection_plugin');
		
		_$('.message', vAcProtectionDiv).innerHTML = $crypt.b64decode(lStorage.getItem('message'));
			
		addFocusInput(vLoginInput, vPassInput);
		
		vSubmitBut.onclick =  function() {
			submitForm(pIndex, pPrlBtn);
		};
		
	}
	
	function submitForm(pIndex, pPrlBtn) {
		$dom.hide(vErrorMessage);

		checkEmptyInput(vPassInput, vLoginInput);
		if (checkEmptyInput.empty)
			return;
			
		if (!pOwner.isConnected()) {
			pOwner.showAlert('Security problem!', 'Can\'t check security status, please connect to the internet', 'OK');
			hideAPwindow();
			return;
		} else { 				
			vErrorMessage.innerHTML = eMagReader.loc('accessProtectionCredentialCheckPleaseWait', null, 'accessprotection_plugin');
			$dom.show(vErrorMessage);
			
			self.getFromPortalBeta( $soap.createRequest("urn:Webservices" + cvPortalAccessProtection, 'checkPassword', {	
				"profile_id" : $soap.createField("string", lStorage.getItem('profile_id')),
				"login" : $soap.createField("string", vLoginInput.value),
				"password" : $soap.createField("string", vPassInput.value)}),
				'checkPassword',
				function(pData) {
					if (+$soap.getFieldValue(pData, 'exists')) {
						appConfig.accessStatus = true;
						$dom.hide(_$('#testLogin'));
						lStorage.setItem('lastValidLogin', vLoginInput.value);
		                lStorage.setItem('lastValidPassword', vPassInput.value);
		                lStorage.setItem('accessStatus', true);
		                hideAPwindow();
		                
		                if (pPrlBtn) {
		                    pPrlBtn.suspended = !pPrlBtn.suspended;
		                    pPrlBtn.innerText = (pPrlBtn.suspended ? 'Download': 'Stop');
		                    pOwner.mngDownloader[pPrlBtn.suspended ? 'stop': 'start'](pPrlBtn.eMagName, !pPrlBtn.suspended);
						}
		                else
		                	if (!isNaN(pIndex)) 
		                		pOwner.coverFlowAction(pIndex);						
					} else {
						vErrorMessage.innerHTML = eMagReader.loc('accessProtectionCredentialCheckFailed', null, 'accessprotection_plugin');
						$dom.show(vErrorMessage);
					}
				})
		}
	}
	
	return self;
} 

