var $FS = {
    fileExists: function(pPath, pCallback) {
        window.fileSystem.root.getFile(pPath.replace(window.fileSystem.root.fullPath + '/', ''), {create: false, exclusive: true}, 
          function() {
             pCallback(true);
	  }, function() {
             pCallback(false);
          });
    }
}