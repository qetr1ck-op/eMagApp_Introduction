function RSS2Channel(rssxml) {
    /*A*/
    /*required string properties*/
    this.title;
    this.link;
    this.description;

    /*optional string properties*/
    this.language;
    this.copyright;
    this.managingEditor;
    this.webMaster;
    this.pubDate;
    this.lastBuildDate;
    this.generator;
    this.docs;
    this.ttl;
    this.rating;

    /*optional object properties*/
    this.category;
    this.image;

    /*array of RSS2Item objects*/
    this.items = new Array();

    /*B*/
    var chanElement = rssxml.getElementsByTagName("channel")[0];
    var itemElements = rssxml.getElementsByTagName("item");

    /*C*/
    for (var i = 0; i < itemElements.length; i++) {
        Item = new RSS2Item(itemElements[i]);
        this.items.push(Item);
    }

    /*D*/
    var properties = new Array("title", "link", "description", "language", "copyright", "managingEditor", "webMaster", "pubDate", "lastBuildDate", "generator", "docs", "ttl", "rating");
    var tmpElement = null;
    for (var i = 0; i < properties.length; i++) {
        tmpElement = chanElement.getElementsByTagName(properties[i])[0];
        if (tmpElement != null) eval("this." + properties[i] + "=tmpElement.childNodes[0].nodeValue");
    }

    /*E*/
    this.category = new RSS2Category(chanElement.getElementsByTagName("category")[0]);
    this.image = new RSS2Image(chanElement.getElementsByTagName("image")[0]);
}

function RSS2Category(catElement) {
    if (catElement == null) {
        this.domain = null;
        this.value = null;
    } else {
        this.domain = catElement.getAttribute("domain");
        this.value = catElement.childNodes[0].nodeValue;
    }
}

function RSS2Image(imgElement) {
    if (imgElement == null) {
        this.url = null;
        this.link = null;
        this.width = null;
        this.height = null;
        this.description = null;
    } else {
        imgAttribs = new Array("url", "title", "link", "width", "height", "description");
        for (var i = 0; i < imgAttribs.length; i++)
        if (imgElement.getAttribute(imgAttribs[i]) != null) eval("this." + imgAttribs[i] + "=imgElement.getAttribute(" + imgAttribs[i] + ")");
    }
}

function RSS2Item(itemxml) {
    /*A*/
    /*required properties (strings)*/
    this.title;
    this.link;
    this.description;

    /*optional properties (strings)*/
    this.author;
    this.comments;
    this.pubDate;

    /*optional properties (objects)*/
    this.category;
    this.enclosure;
    this.guid;
    this.source;
    this.content;

    /*B*/
    var properties = new Array("title", "link", "description", "author", "comments", "pubDate");
    var tmpElement = null;
    for (var i = 0; i < properties.length; i++) {
        tmpElement = itemxml.getElementsByTagName(properties[i])[0];
        if (tmpElement != null) eval("this." + properties[i] + "=tmpElement.childNodes[0].nodeValue");
    }

    /*C*/
    this.category = new RSS2Category(itemxml.getElementsByTagName("category")[0]);
    this.enclosure = new RSS2Enclosure(itemxml.getElementsByTagName("enclosure")[0]);
    this.guid = new RSS2Guid(itemxml.getElementsByTagName("guid")[0]);
    this.source = new RSS2Source(itemxml.getElementsByTagName("source")[0]);
    this.content = getElementTextNS("content", "encoded", itemxml, 0);
}

function RSS2Enclosure(encElement) {
    if (encElement == null) {
        this.url = null;
        this.length = null;
        this.type = null;
    } else {
        this.url = encElement.getAttribute("url");
        this.length = encElement.getAttribute("length");
        this.type = encElement.getAttribute("type");
    }
}

function RSS2Guid(guidElement) {
    if (guidElement == null) {
        this.isPermaLink = null;
        this.value = null;
    } else {
        this.isPermaLink = guidElement.getAttribute("isPermaLink");
        this.value = guidElement.childNodes[0].nodeValue;
    }
}

function RSS2Source(souElement) {
    if (souElement == null) {
        this.url = null;
        this.value = null;
    } else {
        this.url = souElement.getAttribute("url");
        this.value = souElement.childNodes[0].nodeValue;
    }
}

// retrieve text of an XML document element, including
// elements using namespaces
function getElementTextNS(prefix, local, parentElem, index) {
    var result = "";
    result = parentElem.getElementsByTagName(local)[index];
    if (result) {
        // get text, accounting for possible
        // whitespace (carriage return) text nodes 
        if (result.childNodes.length > 1) {
            return result.childNodes[1].nodeValue;
        } else {
            return result.firstChild.nodeValue;
        }
    } else {
        return null;
    }
}