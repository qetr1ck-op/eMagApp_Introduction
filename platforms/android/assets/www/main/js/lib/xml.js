var $xml = new (function cXML() {
    var self = this;

    function trim(pStr) {
    	return pStr.replace(/>[\n,\r, ]+/igm,'>').replace(/[\n,\r, ]+</igm, '<');
    }

    function toJSON(pXML) {
        var vObj = {}, vAttr, i;

		// object type
        if (pXML.nodeType == 1) { // element
            if (pXML.attributes && (pXML.attributes.length > 0)) {
                vObj["#attributes"] = {};
                for (i = 0; i < pXML.attributes.length; i++) {
                    vAttr = pXML.attributes.item(i);
                    vObj["#attributes"][vAttr.nodeName] = vAttr.nodeValue;
                }
            }
        } else if (pXML.nodeType == 3) // text
        	vObj = pXML.nodeValue;

        // do children
        if (pXML.hasChildNodes()) {
            for (i = 0; i < pXML.childNodes.length; i++) {
                var vItem = pXML.childNodes.item(i),
                    vNodeName = vItem.nodeName;
                if (typeof (vObj[vNodeName]) == "undefined") vObj[vNodeName] = toJSON(vItem);
                else {
                    if (typeof (vObj[vNodeName].length) == "undefined") {
                        var vOld = vObj[vNodeName];
                        vObj[vNodeName] = [];
                        vObj[vNodeName].push(vOld);
                    }
                    vObj[vNodeName].push(toJSON(vItem));
                }
            }
        }
        return vObj;
    };

    function toXML(pJSON, pTagName) {
    	var vAttrs = {}, vAttrList = [], vInnerXML = '';
    	if (vAttrs = pJSON['#attributes'])
    		for (var vAttr in vAttrs)
    			vAttrList.push(vAttr + '="' + vAttrs[vAttr] + '"'); 

    	if (!(vInnerXML = pJSON['#text'])) {
    		var vInnerList = [];
    		for (var vPrp in pJSON)
				if (vPrp.charAt(0) != '#')
					vInnerList.push(toXML(pJSON[vPrp], vPrp));
    		
    		vInnerXML = vInnerList.join('\r\n');
    	}
    	
    	if (pTagName)
    		return '<' + pTagName + ' ' + vAttrList.join(' ') + '>' + vInnerXML + '</' + pTagName + '>';
    	else
    		return vInnerXML; 
    }

    self.trim = trim;
    self.toJSONObject = function(pXML) {    	
    	return (pXML ? toJSON(pXML): pXML);
    	
    };

	self.fromJSONObject = function(pJSON) {
		return self.fromString(toXML(pJSON));
    };

	self.toString = function(pObj) {
		return (pObj ? (new XMLSerializer()).serializeToString(pObj.nodeType == undefined ? self.fromJSONObject(pObj): pObj): '');
    };

	self.fromString = function(pStr) {			
		return (pStr.charAt(0) == '<' ? (new DOMParser()).parseFromString(trim(pStr), 'text/xml'): toXML((window.JSON || EM.UTILS.SERVICE).parse(pStr)));
    };

    return self;
})();