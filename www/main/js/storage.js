function cLocalStorage() {
	var self = this, cvCache = {},
		cvFilePath = 'download/eMags/' + APP_ID + '/localStorage.json';		
	
	self.getItem = function(pKey) {
		return cvCache[pKey];
	}
	
	self.setItem = function(pKey, pValue) {
		cvCache[pKey] = pValue;						
	}
	
    function failRead(error) {
        $log.error('File read error: ' + error.code);
    }
    
    function failWrite(error) {
        $log.error('File write error: ' + error.code);
    }   
	
	function readFromFile() {
		window.fileSystem.root.getFile(cvFilePath, null, 	
				function (pFileEntry) {
    				pFileEntry.file(    
    					function (pFile) {
    						var vReader = new FileReader();
    						vReader.onerror = function(evt) {
    							$log.error('Read from file (localStorage.json) error');
    						};
    						vReader.onloadend = function(evt) {
    							cvCache = (window.JSON||EM.U.S).parse(evt.target.result);
    						};
    						vReader.readAsText(pFile);
    					}, failRead
    				);
        		}, failRead
			);		
	}
	
	function writeToFile() {
		  var vWrite = function() {           
		    window.fileSystem.root.getFile(cvFilePath, {create: true, exclusive: false},  
		        function (pFileEntry) {
		            pFileEntry.createWriter(    
		          function (pWriter) {
		           pWriter.onerror = function(evt) {
		            $log.error('[writeToFile]: Save to file failed: ' + pWriter.fileName);
		           };                
		           pWriter.onwriteend = function(evt) {
		               $log.info('[writeToFile]: Sucessfully saved file: ' + pWriter.fileName);
		              };
		              pWriter.write((window.JSON||EM.U.S).stringify(cvCache));        
		             }, failWrite);
		           }, failWrite);
		         };
		  
		  window.fileSystem.root.getDirectory('download', {create: true});
		  window.fileSystem.root.getDirectory('download/eMags', {create: true});
		  
		  window.fileSystem.root.getDirectory('download/eMags/' + APP_ID, {create: true}, vWrite, 
		   function(error) {
		    $log.error('Create folder error (STORAGE): ' + error.code);
		   }
		  );  
	 }	
	
	$FS.fileExists(cvFilePath, function(pExists) {
		if (pExists)
			readFromFile();
		else
			writeToFile();
	});
	
    document.addEventListener("pause", function() {
    	writeToFile();
    }, false);
	
	return self;
}