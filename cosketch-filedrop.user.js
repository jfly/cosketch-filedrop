// ==UserScript==
// @name                cosketch-filedrop
// @namespace	        tag:jeremyfleischman@gmail.com,2012-05-11:cosketch-filedrop
// @description	        Adds file drop support to cosketch.
// @include		http://cosketch.com/*
// ==/UserScript==

// I can't figure out where cosketch assigns this cookie...
// curl --cookie S=MAGIC_COOKIE -F "image=@IMAGE_FILE.jpg" "http://cosketch.com/UploadFile.aspx?GETCHANNELPARAMS()"

// Copied from: https://gist.github.com/1143845
var unsafeWindow = window.unsafeWindow || (
	unsafeWindow = (function() {
		var el = document.createElement('p');
		el.setAttribute('onclick', 'return window;');
		return el.onclick();
	}())
);

function noopDrop(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

function dragEnter(evt) {
	noopDrop(evt);
	showDropMessage();
}
function dragOver(evt) {
	noopDrop(evt);
	showDropMessage();
}
function dragLeave(evt) {
	noopDrop(evt);
	
	// Copied from http://imgscalr.com/, to prevent flickering. I haven't even tried to understand this mess...
	if(evt.pageX < 10 || evt.pageY < 10 || window.innerWidth - evt.pageX < 10  || window.innerHeight - evt.pageY < 10) {
		hideDropMessage();
	}
}
function drop(evt) {
	noopDrop(evt);

	var files = evt.dataTransfer.files;
	hideDropMessage();
	for(var i = 0; i < files.length; i++) {
		loadFile(files[i]);
	}
}

function showDropMessage() {
	dropshadow.style.display = '';
}
function hideDropMessage() {
	dropshadow.style.display = 'none';
}

var pendingUploads = 0;
function loadFile(file) {
	pendingUploads++;
    	unsafeWindow.Callbacks.UploadingFile();

	var params = unsafeWindow.GetChannelParams();
	var url = "/UploadFile.aspx" + params;

        var xhr = new XMLHttpRequest();
        xhr.upload.onprogress = function(e) {
            var percent = (e.loaded/e.total * 100).toFixed(2);

	    var progressDiv = document.getElementById('uploadFileContainer').children[4]
	    var spinner = progressDiv.children[0];

	    progressDiv.innerHTML = "";
	    progressDiv.appendChild(spinner);
	    progressDiv.appendChild(document.createTextNode('Uploading... ' + percent + "% (" + pendingUploads + " file(s) remaining"));
        };
        xhr.onreadystatechange = function() {
            if(this.readyState == 4) {
		if(--pendingUploads === 0) {
			unsafeWindow.Callbacks.UploadComplete();
		}
            }
        };

        xhr.open('POST', url, true);
	var fd = new FormData();
	fd.append('image', file);
        xhr.send(fd);

	showFileUploadIfNotVisible();
}

function showFileUploadIfNotVisible() {
	var isVisible = document.getElementById('RECENTBACKGROUNDS').style.display == 'block';
	if(!isVisible) {
		unsafeWindow.Fe(); // lol, obsfucated code
	}
}

var dropshadow = document.createElement('div');
var dropshadowText = document.createElement('div');

dropshadow.style.position = 'absolute';
dropshadow.style.top = '0';
dropshadow.style.left = '0';
dropshadow.style.width = '100%';
dropshadow.style.height = '100%';
dropshadow.style.opacity = '.8';
dropshadow.style.background = 'red';
dropshadow.style.zIndex = '100'; // lol, magic numbers

// just for pretty
var fontSize = 20;
dropshadow.style.textAlign = 'center';
dropshadow.style.fontSize = fontSize + 'px';
dropshadow.style.fontFamily = 'sans-serif';

dropshadowText.style.position = 'absolute';
dropshadowText.style.top = '50%';
dropshadowText.style.width = '100%';
dropshadowText.style.marginTop = "-" + (fontSize/2) + "px";

document.body.appendChild(dropshadow);
dropshadow.appendChild(dropshadowText);
dropshadowText.appendChild(document.createTextNode("Drop (image!) file(s) anywhere to upload"));

hideDropMessage();

var dropbox = document.body;
dropbox.addEventListener("dragenter", dragEnter, false);
dropbox.addEventListener("dragleave", dragLeave, false);
dropbox.addEventListener("dragover", dragOver, false);
dropbox.addEventListener("drop", drop, false);
