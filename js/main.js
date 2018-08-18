//
// TODO: look into splitting into mutliple files
// TODO: add "view mode" for reporting, including single course only (no dropdown)
// TODO: add "new course" button
//
const app = function () {
	const PAGE_TITLE = 'Course standards editor'
	const PAGE_VERSION = 'v0.1';
	
	const API_BASE = 'https://script.google.com/macros/s/AKfycbymCm2GsamiaaWMfMr_o3rK579rz988lFK5uaBaRXVJH_8ViDg/exec';
	const API_KEY = 'MVstandardsAPI';
	const DEPARTMENTS = ['cte', 'english', 'math', 'socialstudies', 'science', 'worldlanguage'];
	
	const NO_COURSE = 'NO_COURSE';
	
	const AP_KEY = 'AP';
	const AP_POLICY_DOC = 'https://drive.google.com/open?id=1CnvIf-ZaTD5INn8ACzZi942oRpEE887EuJFipJ5eFNI';
	
	const SAVE_ME_CLASS = 'cse-save-me';
	
	const page = {};
	const apPolicyDoc = {};
	const ssData = {};

	function init () {
		page.header = document.getElementById('header');
		page.courselist = document.getElementById('courselist');
		page.standards = document.getElementById('standards');
		page.notice = document.getElementById('notice');
		
		_renderHeader();
		
		apPolicyDoc.text = 'Michigan Virtual Advanced Placement Course Policy';
		apPolicyDoc.link = AP_POLICY_DOC;
		
		page.dirtyBit = false;
		
		ssData.lastUpdateKey = 'Last_update';
		
		_getInitialization();
	}

	function _getInitialization() {
		_setNotice('initializing...');

		fetch(_buildApiUrl('initialize'))
			.then((response) => response.json())
			.then((json) => {
				console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				
				console.log('json.data: ' + JSON.stringify(json.data));
				_setNotice('');
				_getCourseList()
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
				console.log(error);
			})
	}
	
	function _getCourseList () {
		page.content.innerHTML = '';
		_getCourseList();
	}

	function _getCourseList () {
		_setNotice('loading course list...');

		fetch(_buildApiUrl('courselist'))
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				ssData.courseList = json.data;
				_setNotice('');
				_renderCourseList(json.data);
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
				console.log(error);
			})
	}

	function _getCourseStandards (coursename, forceCacheFlush) {
		_setNotice('loading course standards...');
		_removeCourseStandards();

		fetch(_buildApiUrl('standards', coursename, null, forceCacheFlush))
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				ssData.standardsData = json.data;
				
				_renderCourseStandards(json.data);
				_setNotice('');
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course standards');
				console.log(error);
			})
	}

	function _postCourseStandards () {
		_setNotice('posting course standards...');
		var coursename = ssData.standardsData.courseName;
		
		var postData = {
			"coursename": coursename,
			"courseRowNumber": ssData.standardsData.courseRowNumber, 
			"standardsChanges": _findStandardsChanges()
		};
		console.log('posting course standards: ' + JSON.stringify(postData));
		
		/**
			console.log('actual posting disabled');
			_setNotice('');
			return;
		/**/
		
		fetch(_buildApiUrl('standards', coursename), {
				method: 'post',
				body: JSON.stringify(postData)
			})
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				console.log('json.data: ' + JSON.stringify(json.data));
				
				_setNotice('');
				
				_getCourseStandards(coursename, false);
			})
			.catch((error) => {
				_setNotice('Unexpected error posting course standards');
				console.log(error);
			})
	}
	
	function _buildApiUrl (datasetname, coursename, keyname, flushcache) {
		let url = API_BASE;
		url += '?key=' + API_KEY;
		url += datasetname && datasetname !== null ? '&dataset=' + datasetname : '';
		url += coursename && coursename !== null ? '&coursename=' + coursename : '';
		url += keyname && keyname !== null ? '&keyname=' + keyname : '';
		url += flushcache && flushcache != null ? '&flushcache=' + flushcache : '';
		console.log('buildApiUrl: url=' + url);
		return url;
	}

	function _setNotice (label) {
		page.notice.innerHTML = label;
		/**/
		if (label == '') {
			page.notice.style.display = 'none'; 
			page.notice.style.visibility = 'hidden';
		} else {
			page.notice.style.display = 'block';
			page.notice.style.visibility = 'visible';
		}
		/**/
	}

	function _renderHeader() {
		page.header.classList.add('cse-header');
		
		var elemTitle = document.createElement('span');
		elemTitle.innerHTML = PAGE_TITLE ;//+ ' (' + PAGE_VERSION + ')';
		
		page.header.appendChild(elemTitle);
	}
	
	function _renderCourseList(data) {
		var elemSelect = document.createElement('select');
		elemSelect.id = 'selectCourse';
		elemSelect.classList.add('cse-control');
		
		var elemDefaultOption = document.createElement('option');
		elemDefaultOption.text = '<select a course>';
		elemDefaultOption.value = NO_COURSE;
		elemSelect.appendChild(elemDefaultOption);
		
		for (var i = 0; i < data.length; i++) {
			var elemOption = document.createElement('option');
			elemOption.text = data[i].long;
			elemOption.value = data[i].short;
			elemSelect.appendChild(elemOption);
		}
		elemSelect.addEventListener('change',  _courseSelectChanged, false);

		page.header.appendChild(elemSelect);
	}
	
	function _renderCourseStandards(data) {
		_removeCourseStandards();
		var catList = data.categoryInfo.categoryList;
		var catData = data.categoryInfo.categories;
		var fullKeyList = data.categoryInfo.fullKeyList;
		var standardsData = data.standards;
		var selectionsData = data.selections.allSelections;
		
		for (var i = 0; i < catList.length; i++) {
			var catKey = catList[i];
			var catElement = _createCategoryElement(catData[catKey]);
			var standardsKeyInfo = catData[catKey].keyList;
			
			for (var j = 0; j < standardsKeyInfo.length; j++) {
				var standardsKey = standardsKeyInfo[j];
				var standardValue = standardsData[standardsKey];
				var standardSelections = selectionsData[standardsKey];
				catElement.appendChild(_createStandardsElement(standardsKey, fullKeyList[standardsKey], standardValue, standardSelections));
			}
			
				if (i > 0) {
					page.standards.appendChild(document.createElement('br'));
				}
				page.standards.appendChild(catElement);
		}

		var allSaveElements = document.getElementsByClassName(SAVE_ME_CLASS);
		for (var i = 0; i < allSaveElements.length; i++) {
			allSaveElements[i].addEventListener('change', function() {_setDirtyBit(this, true)}, false);
		}
		page.dirtyBit = false;
		
		_renderControlButtons();
	}
	
	function _removeCourseStandards() {
		while (page.standards.firstChild) {
			page.standards.removeChild(page.standards.firstChild);
		}
		
		_removeControlButtons();
	}
	
	function _removeControlButtons() {
		var elemSave = page.savebutton;
		if (typeof(elemSave) != 'undefined' && elemSave != null) {
			page.savebutton.parentNode.removeChild(elemSave);
			page.savebutton = null;
		}

		var elemReload = page.reloadbutton;
		if (typeof(elemReload) != 'undefined' && elemReload != null) {
			page.reloadbutton.parentNode.removeChild(elemReload);
			page.reloadbutton = null;
		}
	}
	
	function _createCategoryElement(categoryInfo) {
		var elemCategory;
		
		if (categoryInfo.includePrompt) {
			var elemCategory = document.createElement('div');
			elemCategoryTitle = document.createElement('span');
			elemCategoryTitle.classList.add('cse-category-title');
			elemCategoryTitle.innerHTML = categoryInfo.prompt;
			elemCategory.appendChild(elemCategoryTitle);
			
		} else {
			elemCategory = document.createElement('span');
		}
		return elemCategory;
	}
	
	function _createStandardsElement(keyName, keyInfo, standardValue, selections) {
		var elemWrapper = document.createElement('span');
		
		if (keyInfo.keyDisplay) {
			var elemStandard;

			if (keyInfo.keyType == 'text') {
				elemStandard = _createStandardsElement_text(keyName, keyInfo, standardValue);		
				
			} else if (keyInfo.keyType == 'nonedit') {
				elemStandard = _createStandardsElement_nonedit(keyName, keyInfo, standardValue);		
				
			} else if (keyInfo.keyType == 'datalist') {
				elemStandard = _createStandardsElement_datalist(keyName, keyInfo, standardValue, selections);
				
			} else if (keyInfo.keyType == 'tf') {
				elemStandard = _createStandardsElement_tf(keyName, keyInfo, standardValue);
				
			} else if (keyInfo.keyType == 'link') {
				elemStandard = _createStandardsElement_link(keyName, keyInfo, standardValue);
				
			} else {
				elemStandard = _createStandardsElement_unrecognized(keyName, keyInfo, standardValue);
			}
			
			elemWrapper.appendChild(elemStandard);
		}
		
		return elemWrapper;
	}
	
	function _createStandardsElement_text(keyName, keyInfo, standardValue) {
		var elemStandard = document.createElement('div');
		elemStandard.classList.add('cse-standards');
		
		var elemPrompt = document.createElement('span');
		elemPrompt.classList.add('cse-standards-prompt');
		elemPrompt.innerHTML = keyInfo.keyPrompt;
		
		var elemValue = document.createElement('input');
		elemValue.type = 'text';
		elemValue.id = keyName;
		elemValue.value = standardValue;
		elemValue.classList.add('cse-standards-text');
		elemValue.classList.add(SAVE_ME_CLASS);
		elemValue.maxLength = 200;
		elemValue.size = 40;
		
		elemStandard.appendChild(elemPrompt);
		elemStandard.appendChild(elemValue);

		return elemStandard;
	}
	
	function _createStandardsElement_nonedit(keyName, keyInfo, standardValue) {
		var elemStandard = document.createElement('div');
		elemStandard.classList.add('cse-standards');
		
		var elemPrompt = document.createElement('span');
		elemPrompt.classList.add('cse-standards-prompt');
		elemPrompt.innerHTML = keyInfo.keyPrompt;
		
		var elemValue = document.createElement('span');
		elemValue.id = keyName;
		elemValue.innerHTML = standardValue;
		elemValue.classList.add('cse-standards-nonedit');
		
		elemStandard.appendChild(elemPrompt);
		elemStandard.appendChild(elemValue);

		return elemStandard;
	}
				
	function _createStandardsElement_datalist(keyName, keyInfo, standardValue, selections) {
		var elemStandard = document.createElement('div');
		elemStandard.classList.add('cse-standards');
		
		var elemPrompt = document.createElement('span');
		elemPrompt.classList.add('cse-standards-prompt');
		elemPrompt.innerHTML = keyInfo.keyPrompt;
		
		var elemList = document.createElement('input');
		elemList.id = keyName;
		var elemListName = 'list' + keyName;
		elemList.setAttribute('list', elemListName);
		elemList.classList.add('cse-standards-list');
		elemList.classList.add(SAVE_ME_CLASS);
		var elemDatalist = document.createElement('datalist');
		elemDatalist.id = elemListName;

		for (var i = 0; i < selections.length; i++) {
			var elemOption = document.createElement('option');
			elemOption.value = selections[i];
			elemDatalist.appendChild(elemOption);
		}
		elemList.value = standardValue;
		
		elemStandard.appendChild(elemPrompt);
		elemStandard.appendChild(elemList);
		elemStandard.appendChild(elemDatalist);

		return elemStandard;
	}

	function _createStandardsElement_tf(keyName, keyInfo, standardValue) {
		var elemStandard = document.createElement('div');
		elemStandard.classList.add('cse-standards');

		var elemPrompt = document.createElement('span');
		elemPrompt.innerHTML = keyInfo.keyPrompt;
		
		var elemCheckbox = document.createElement('input');
		elemCheckbox.type = 'checkbox';
		elemCheckbox.id = keyName;
		elemCheckbox.classList.add('cse-standards-tf');
		elemCheckbox.classList.add(SAVE_ME_CLASS);
		elemCheckbox.checked = standardValue;
				
		elemStandard.appendChild(elemPrompt);
		elemStandard.appendChild(elemCheckbox);

		if (keyName == AP_KEY  && standardValue) {
			var elemLink = document.createElement('a');
			elemLink.classList.add('cse-standards-link');
			elemLink.text = apPolicyDoc.text;
			elemLink.href = apPolicyDoc.link;
			elemLink.target = "_blank";
			elemStandard.appendChild(elemLink);
		}				
		return elemStandard;
	}

				
	function _createStandardsElement_link(keyName, keyInfo, standardValue) {
		//TODO: implement editing and saving of this type of link as need arises
		var elemStandard = document.createElement('div');

		var linkInfo = JSON.parse(standardValue);
		//console.log(keyInfo.keyName + ': ' + JSON.stringify(linkInfo) + ', ' + linkInfo.text);
		if (linkInfo.text) {
			var elemStandard = document.createElement('div');
			
			var elemLink = document.createElement('a');
			elemLink.classList.add('cse-standards-link');
			elemLink.text = linkInfo.text;
			elemLink.href = linkInfo.link;
			elemLink.target = "_blank";
			
			elemStandard.appendChild(elemLink);
		
		} else {
			elemStandard = document.createElement('span');
		}
		return elemStandard;
	}
	
	function _createStandardsElement_unrecognized(keyName, keyInfo, standardValue) {
		var elemStandard = document.createElement('div');
		elemStandard.classList.add('cse-standards');
		elemStandard.innerHTML = keyInfo.keyPrompt + '(' + keyName + ' unrecognized type: ' + keyInfo.keyType + ')';

		return elemStandard;
	}
	
	function _renderControlButtons() {
		var elemSave = document.createElement('button');
		elemSave.id = 'btnSave';
		elemSave.classList.add('cse-control');
		elemSave.innerHTML = 'save';
		elemSave.addEventListener('click', _saveButtonClicked, false);

		var elemReload = document.createElement('button');
		elemReload.id = 'btnReload';
		elemReload.classList.add('cse-control');
		elemReload.innerHTML = 'reload';
		elemReload.addEventListener('click', _reloadButtonClicked, false);
		
		page.savebutton = elemSave;
		page.reloadbutton = elemReload
		
		page.header.appendChild(elemSave);
		page.header.appendChild(elemReload);
	}
	
	function _findStandardsChanges() {
		var changeInfo = {
			"changeFlag": false,
			"keysWithChanges": {}
		};
		var standards = ssData.standardsData.standards;
		var fullKeyList = ssData.standardsData.categoryInfo.fullKeyList;
		
		var formattedNow = new Date().toLocaleString();
		changeInfo.keysWithChanges[ssData.lastUpdateKey] = _makeUpdateObject(formattedNow, false, fullKeyList[[ssData.lastUpdateKey]].keyIndex);
		
		var saveElements = document.getElementsByClassName(SAVE_ME_CLASS);
		for (var i = 0; i < saveElements.length; i++) {
			var elem = saveElements.item(i);
			var key = elem.id;
			
			var newValue;
			
			if (elem.type == 'text') { // includes both text and datalist
				newValue = elem.value;
			} else if (elem.type == 'checkbox') {
				newValue = elem.checked;
			} else {
				newValue = '????';
			}
			
			var currentValue = standards[key];
			var newSelectionKey  = false;
			if (currentValue != newValue) {
				if (elem.type == 'text') newSelectionKey = isSelectionKeyNew(key, newValue);
				var keyIndex = fullKeyList[key].keyIndex;
				
				changeInfo.changeFlag = true;
				changeInfo.keysWithChanges[key] = _makeUpdateObject(newValue, newSelectionKey, keyIndex);
			}
		}
		
		return changeInfo;
	}
	
	function _makeUpdateObject(value, newSelectionKey, keyIndex) {
		return {"newValue": value, "newSelectionKey": newSelectionKey, "keyIndex": keyIndex};
	}
	
	function isSelectionKeyNew(key, value) {
		var selectionsForKey = ssData.standardsData.selections.allSelections[key];
		var isNewSelection = true;
		for (var i = 0; i < selectionsForKey.length && isNewSelection; i++) {
			isNewSelection = (value != selectionsForKey[i]);
		}
		
		return isNewSelection;
	}
	
	function _setDirtyBit(elem, setTo) {
		page.dirtyBit = setTo;
		if (page.dirtyBit) {
			page.savebutton.innerHTML = '*save';
		}
	}
	
	function _confirmDiscardChanges() {
		var confirmResult = confirm("Changes will not be saved. Continue anyway?");
		
		return confirmResult;
	}
	
	function _courseSelectChanged(evt) {
		var elemSelect = document.getElementById('selectCourse');
		var newCourseName = elemSelect.value;
		
		if (newCourseName == NO_COURSE) return;	

		var doCourseSelect = true;;
		
		if (page.dirtyBit) {
			doCourseSelect = _confirmDiscardChanges();
		}
		
		if (doCourseSelect) {
			_getCourseStandards(newCourseName, false);
		} else {
			elemSelect.value = ssData.standardsData.courseName;
		}
	}
	
	function _saveButtonClicked(evt) {
		if (page.dirtyBit) {
			_postCourseStandards();
		}
	}
	
	function _reloadButtonClicked(evt) {
		var doReload = true;
		if (page.dirtyBit) {
			doReload = _confirmDiscardChanges();
		}
		
		if (doReload) {
			_removeCourseStandards();
			_getCourseStandards(ssData.standardsData.courseName, true);  // TODO: force flush here?
		}
	}
	
	return {
		init: init
 	};
}();