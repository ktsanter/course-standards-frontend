//
// TODO: look into splitting into mutliple files
// TODO: add "view mode" for reporting, including single course only (no dropdown) - rework query params
// TODO: generate link and/or embed code for BB from editor
//
const app = function () {
	const PAGE_TITLE = 'Course standards'
	const PAGE_VERSION = 'v0.1';
	
	const API_BASE = 'https://script.google.com/macros/s/AKfycbymCm2GsamiaaWMfMr_o3rK579rz988lFK5uaBaRXVJH_8ViDg/exec';
	const API_KEY = 'MVstandardsAPI';
	const DEPARTMENTS = [
		{'shortname': 'cte', 'longname': 'CTE'},
		{'shortname': 'elavpa', 'longname': 'ELA/VPA'},
		{'shortname': 'math', 'longname': 'Mathematics'},
		{'shortname': 'ss', 'longname': 'Social Studies'},
		{'shortname': 'science', 'longname': 'Science'},
		{'shortname': 'wl', 'longname': 'World Languages'}
	];
	
	const NO_COURSE = 'NO_COURSE';
	
	const AP_KEY = 'AP';
	const AP_POLICY_DOC = 'https://drive.google.com/open?id=1CnvIf-ZaTD5INn8ACzZi942oRpEE887EuJFipJ5eFNI';
	
	const SAVE_ME_CLASS = 'cse-save-me';
	
	const params = {};
	const page = {};
	const apPolicyDoc = {};
	const ssData = {};

	function init () {
		page.header = document.getElementById('header');
		page.header.toolname = document.getElementById('toolname');
		page.header.courses = document.getElementById('courses');
		page.header.controls = document.getElementById('controls');
		
		page.standards = document.getElementById('standards');
		page.notice = document.getElementById('notice');
		page.notice.classList.add('cse-notice');
		page.prompt = document.getElementById('prompt');
		
		ssData.lastUpdateKey = 'Last_update';
		ssData.longCourseNameKey = 'Official_course_name';
		ssData.standardsData = {"courseName": null};

		apPolicyDoc.text = 'Michigan Virtual Advanced Placement Course Policy';
		apPolicyDoc.link = AP_POLICY_DOC;

		
		if (!_validateParams()) {
			_setNotice('error: invalid parameter');
			
		} else {
			_initHeader();
			_initPrompt(false);
			_setDirtyBit(false);
			_getInitialization();
		}
	}

	function _validateParams() {
		/*
		* params:
		*    department:  short name for department (required)
		*    course: short name for course, required for view mode, ignored for edit mode
		*    editx: true for editor mode - default is view mode
		*/
		var result = false;
		
		params.department = {'shortname': null, 'longname': null};
		
		var urlParams = new URLSearchParams(window.location.search);
		var departmentParam = urlParams.has('department') ? urlParams.get('department') : null;
		params.course = urlParams.has('course') ? urlParams.get('course') : null;
		params.editmode = urlParams.has('editx') ? urlParams.get('editx') : false;
		
		// params must include department
		if (departmentParam != null) {
			for (var i = 0; i < DEPARTMENTS.length && !result; i++) {
				if (departmentParam == DEPARTMENTS[i].shortname) {
					params.department.shortname = departmentParam;
					params.department.longname = DEPARTMENTS[i].longname;
					result = true;			
				}					
			}			
		}
		
		if (params.editmode && params.course == null) result = false;
		console.log('params= ' + JSON.stringify(params));
		
		return result;
	}
	
	function _getInitialization() {
		_setNotice('initializing...');
		_enableControls(false);
		
		fetch(_buildApiUrl('initialize'))
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				
				//console.log('json.data: ' + JSON.stringify(json.data));
				_setNotice('');
				if (params.editmode) {
					_getCourseList();
				} else {
					_getCourseStandards(params.course);
				}
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
				console.log(error);
			})
	}
	
	function _getCourseList () {
		_setNotice('loading course list...');
		_enableControls(false);

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

	function _getCourseStandards (coursename) {
		if (coursename == NO_COURSE) return;
		
		_setNotice('loading course standards...');
		_enableControls(false);
		_removeCourseStandards();

		fetch(_buildApiUrl('standards', coursename))
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
				_setNotice('Unexpected error loading course standards for "' + coursename + '"');
				console.log(error);
			})
	}
	
	
	function _getReload (coursename) {
		_setNotice('reloading...');
		_enableControls(false);
		
		fetch(_buildApiUrl('initialize'))
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				_setNotice('');
				_getReloadCourseList(coursename);
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
				console.log(error);
			})
	}

	function _getReloadCourseList (coursename) {
		_setNotice('reloading course list...');
		_enableControls(false);

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
				page.courseselect.value = coursename;
				_getCourseStandards(coursename);
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
				console.log(error);
			})
	}

	function _postCourseStandards () {
		_setNotice('posting course standards...');
		_enableControls(false);
		var coursename = ssData.standardsData.courseName;
		
		var postData = {
			"coursename": coursename,
			"courseRowNumber": ssData.standardsData.courseRowNumber, 
			"standardsChanges": _findStandardsChanges()
		};
		//console.log('posting course standards: ' + JSON.stringify(postData));
		
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
				//console.log('json.data: ' + JSON.stringify(json.data));

				page.courseselect.options[page.courseselect.selectedIndex].innerHTML = document.getElementById(ssData.longCourseNameKey).value;
				_setNotice('');
				
				_getCourseStandards(coursename);
			})
			.catch((error) => {
				_setNotice('Unexpected error posting course standards');
				console.log(error);
			})
	}
	
	function _postNewCourse (shortCourseName, longCourseName) {
		_setNotice('posting new course...');
		_enableControls(false);
		
		var postData = {
			"shortcoursename": shortCourseName,
			"longcoursename": longCourseName
		};
		
		/*
			console.log('actual posting disabled');
			_setNotice('');
			return;
		*/

		fetch(_buildApiUrl('newcourse'), {
				method: 'post',
				body: JSON.stringify(postData)
			})
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				
				_loadNewCourse(json.data);

			})
			.catch((error) => {
				_setNotice('Unexpected error posting course standards');
				console.log(error);
			})
	}
	
	function _postDeleteCourse (shortCourseName) {
		_setNotice('posting course deletion...');
		_enableControls(false);
		
		var postData = {
			"shortcoursename": shortCourseName
		};

		/*
			console.log('actual posting disabled');
			_setNotice('');
			return;
		*/

		fetch(_buildApiUrl('delete'), {
				method: 'post',
				body: JSON.stringify(postData)
			})
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				
				_loadAfterDeleteCourse(json.data);

			})
			.catch((error) => {
				_setNotice('Unexpected error posting course deletion');
				console.log(error);
			})
	}
	
	function _buildApiUrl (datasetname, coursename, keyname) {
		let url = API_BASE;
		url += '?key=' + API_KEY;
		url += '&department=' + params.department.shortname;
		url += datasetname && datasetname !== null ? '&dataset=' + datasetname : '';
		url += coursename && coursename !== null ? '&coursename=' + coursename : '';
		url += keyname && keyname !== null ? '&keyname=' + keyname : '';
		console.log('buildApiUrl: url=' + url);
		return url;
	}

	function _showPrompt(show) {
		if (show) {
			page.prompt.style.display = 'block';
			page.prompt.style.visibility = 'visible';
		} else {
			page.prompt.style.display = 'none'; 
			page.prompt.style.visibility = 'hidden';
		}
	}
	
	function _showStandards(show) {
		if (show) {
			page.standards.style.display = 'block';
			page.standards.style.visibility = 'visible';
		} else {
			page.standards.style.display = 'none'; 
			page.standards.style.visibility = 'hidden';
		}
	}
	
	function _enableControls(enable) {
		page.courseselect.disabled = !enable;
		page.savebutton.disabled = !enable;
		page.reloadbutton.disabled = !enable;
		page.addbutton.disabled = !enable;
		page.deletebutton.disabled = !enable;
	}

	function _setNotice (label) {
		page.notice.innerHTML = label;

		if (label == '') {
			page.notice.style.display = 'none'; 
			page.notice.style.visibility = 'hidden';
		} else {
			page.notice.style.display = 'block';
			page.notice.style.visibility = 'visible';
		}
	}
	
	function _renderCourseList(data) {
		var elemSelect = page.courseselect;
		
		while (elemSelect.firstChild) {
			elemSelect.removeChild(elemSelect.firstChild);
		}
	
		var tempArray = new Array();
		for (var i = 0; i < data.length; i++) {
			tempArray[i] = new Array();
			tempArray[i][0] = data[i].long;
			tempArray[i][1] = data[i].short;
		}
		tempArray.sort();
		
		var elemDefaultOption = document.createElement('option');
		elemDefaultOption.text = '<select a course>';
		elemDefaultOption.value = NO_COURSE;
		elemSelect.appendChild(elemDefaultOption);
		
		for (var i = 0; i < tempArray.length; i++) {
			var elemOption = document.createElement('option');
			elemOption.text = tempArray[i][0];
			elemOption.value = tempArray[i][1];
			elemSelect.appendChild(elemOption);
		}
		
		_enableControls(true);
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
			allSaveElements[i].addEventListener('change', function() {_setDirtyBit(true)}, false);
		}
		_setDirtyBit(false);
		_enableControls(true);
	}
	
	function _removeCourseStandards() {
		while (page.standards.firstChild) {
			page.standards.removeChild(page.standards.firstChild);
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
		
		if (params.editmode) {
			console.log('edit mode');
			var elemValue = document.createElement('input');
			elemValue.type = 'text';
			elemValue.id = keyName;
			elemValue.value = standardValue;
			elemValue.classList.add('cse-standards-text');
			elemValue.classList.add(SAVE_ME_CLASS);
			elemValue.maxLength = 200;
			elemValue.size = 40;
		} else {
			console.log('view mode');
			var elemValue = document.createElement('span');
			elemValue.id = keyName;
			elemValue.innerHTML = standardValue;
			elemValue.classList.add('cse-standards-nonedit');
		}
		
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
		elemStandard.appendChild(elemPrompt);
		
		if (params.editmode) {
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
			
			elemStandard.appendChild(elemList);
			elemStandard.appendChild(elemDatalist);
		} else {
			var elemValue = document.createElement('span');
			elemValue.id = keyName;
			elemValue.innerHTML = standardValue;
			elemValue.classList.add('cse-standards-nonedit');
			
			elemStandard.appendChild(elemValue);
		}
		

		return elemStandard;
	}

	function _createStandardsElement_tf(keyName, keyInfo, standardValue) {
		var elemStandard = document.createElement('div');
		elemStandard.classList.add('cse-standards');

		var elemPrompt = document.createElement('span');
		elemPrompt.innerHTML = keyInfo.keyPrompt;
		
		var elemCheckbox;
		if (params.editmode) {
			elemCheckbox = document.createElement('input');
			elemCheckbox.type = 'checkbox';
			elemCheckbox.id = keyName;
			elemCheckbox.classList.add(SAVE_ME_CLASS);
			elemCheckbox.checked = standardValue;
			elemCheckbox.classList.add('cse-standards-tf');
		} else {
			elemCheckbox = document.createElement('span');
			elemCheckbox.id = keyName;
			elemCheckbox.innerHTML = standardValue ? '🗹' : '☐';
			elemCheckbox.classList.add('cse-standards-tf-view');			
		}
				
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
	
	function _initHeader() {
		page.header.classList.add('cse-header');
		
		page.header.toolname.innerHTML = PAGE_TITLE + ' (' + params.department.longname + ')';
		
		var elemCourseSelect = document.createElement('select');
		elemCourseSelect.id = 'selectCourse';
		elemCourseSelect.classList.add('cse-control');
		elemCourseSelect.addEventListener('change',  _courseSelectChanged, false);

		var elemNew = _makeButton('btnNew', 'cse-control', '➕', 'new course', _addButtonClicked);
		var elemSave= _makeButton('btnSave', 'cse-control', '💾', 'save course', _saveButtonClicked);
		var elemReload = _makeButton('btnReload', 'cse-control', '🔄', 'reload course', _reloadButtonClicked);
		var elemDelete = _makeButton('btnDelete', 'cse-control', '✖️', 'delete course', _deleteButtonClicked);
		
		page.courseselect = elemCourseSelect;
		page.addbutton = elemNew;
		page.savebutton = elemSave;
		page.reloadbutton = elemReload;
		page.deletebutton = elemDelete;
			
		if (params.editmode) {
			page.header.courses.appendChild(elemCourseSelect);
			page.header.controls.appendChild(elemNew);	
			page.header.controls.appendChild(elemSave);
			page.header.controls.appendChild(elemReload);
			page.header.controls.appendChild(elemDelete);
		}
	}
	
	function _initPrompt() {
		_showPrompt(false);
		
		page.prompt.classList.add('cse-standards-text');
		
		var elemTitle = document.createElement('div');
		elemTitle.classList.add('cse-category-title');
		elemTitle.innerHTML = 'Add new course';
		
		var elemShortName = document.createElement('input');
		elemShortName.type = 'text';
		elemShortName.id = 'promptShortName';
		elemShortName.maxlength = 30;
		elemShortName.size = elemShortName.maxLength;
		elemShortName.classList.add('cse-standards-text');
		
		var elemLongName = document.createElement('input');
		elemLongName.type = 'text';
		elemLongName.id = 'promptLongName';
		elemLongName.maxlength = 100;
		elemLongName.size = elemLongName.maxlength;
		elemLongName.classList.add('cse-standards-text');

		var elemTable = document.createElement('table');
		var elemRow1 = document.createElement('tr');
		var elemCell1_1 = document.createElement('td');
		var elemCell1_2 = document.createElement('td');
		
		var elemRow2 = document.createElement('tr');
		var elemCell2_1 = document.createElement('td');
		var elemCell2_2 = document.createElement('td');
		
		var elemRow3 = document.createElement('tr');
		var elemCell3_1 = document.createElement('td');
		var elemCell3_2 = document.createElement('td');

		elemCell1_1.innerHTML = 'short course name';
		elemCell1_2.appendChild(elemShortName);
		var elemSpan = document.createElement('span');
		elemSpan.innerHTML = '&nbsp; &nbsp; please use only numbers, characters, and underscores - no spaces or other punctuation';
		elemCell1_2.appendChild(elemSpan);
		
		elemCell2_1.innerHTML = 'official course name';
		elemCell2_2.appendChild(elemLongName);
		
		elemRow1.appendChild(elemCell1_1);
		elemRow1.appendChild(elemCell1_2);
		elemRow2.appendChild(elemCell2_1);
		elemRow2.appendChild(elemCell2_2);
		
		elemTable.appendChild(elemRow1);
		elemTable.appendChild(elemRow2);
		elemTable.appendChild(elemRow3);

		var elemPromptConfirm = _makeButton('btnPromptConfirm', 'cse-control-inverted', 'add new course', '', function() {_completeAddCourse(true);});
		var elemPromptCancel = _makeButton('btnPromptCancel', 'cse-control-inverted', 'cancel', '', function() {_completeAddCourse(false);});
		
		var elemPromptError = document.createElement('span');
		elemPromptError.classList.add('cse-standards-text');
		elemPromptError.style.color = 'red';
		
		page.prompt.appendChild(elemTitle);
		page.prompt.appendChild(elemTable);
		page.prompt.appendChild(elemPromptConfirm);
		page.prompt.appendChild(elemPromptCancel);
		page.prompt.appendChild(elemPromptError);
		
		page.promptshortname = elemShortName;
		page.promptlongname = elemLongName;
		page.prompt.error = elemPromptError;
	}
	
	function _makeButton(id, className, label, title, listener) {
		var btn = document.createElement('button');
		btn.id = id;
		btn.classList.add(className);
		btn.innerHTML = label;
		btn.title = title;
		btn.addEventListener('click', listener, false);
		return btn;
	}
	
	function _setDirtyBit(setTo) {
		page.dirtyBit = setTo;
		if (page.dirtyBit) {
			page.header.toolname.innerHTML = '*' + PAGE_TITLE + ' (' + params.department.longname + ')';
		} else {
			page.header.toolname.innerHTML = PAGE_TITLE + ' (' + params.department.longname + ')';
		}
	}
	
	function _enableAddCoursePrompt(enable) {
		_enableControls(!enable);
		_showStandards(!enable);
		_showPrompt(enable);		
	}
		
	function _completeAddCourse(confirmed) {
		page.prompt.error.innerHTML = '';
		if (confirmed) {
			var newShortName = page.promptshortname.value;
			var newLongName = page.promptlongname.value;
			
			var sanitizedShort = newShortName.replace(/[^\w]/gi, '');
			var sanitizedLong = newLongName.replace(/[^\w\"'()\- &:]/gi, '');

			if (newShortName != sanitizedShort) {
				page.prompt.error.innerHTML = 'Please use only letters, numbers, and underscores in the short course name';
				return;
			}
			if (sanitizedShort == '' || sanitizedLong == '') {
				page.prompt.error.innerHTML = 'The short and official names cannot be blank';
				return;
			}
			
			_postNewCourse(sanitizedShort, sanitizedLong);
			
		} else {
			_enableAddCoursePrompt(false);
		}
	}
	
	function _loadNewCourse(data) {
		_setNotice('');

		if (!data.success) {
			page.prompt.error.innerHTML = 'error: ' + data.details.error;
			return;
		}

		_removeCourseStandards();
		_enableAddCoursePrompt(false);
		_getReload(data.details.shortcoursename);
	}
	
	function _loadAfterDeleteCourse(data) {
		console.log('loadAfterDeleteCourse: data=' + JSON.stringify(data));
		_setNotice('');
		
		if (!data.success) {
			console.log('detail: ' + JSON.stringify(data.details));
			console.log('error: ' + JSON.stringify(data.details.error));
			_setNotice('error in deletion: ' + data.details.error);
			return;
		}

		_removeCourseStandards();
		_getReload(NO_COURSE);
}
	
	function _confirmDiscardChanges() {
		var confirmResult = confirm("Changes will not be saved. Continue anyway?");
		
		return confirmResult;
	}

	function _courseSelectChanged(evt) {
		var elemSelect = page.courseselect;
		var newCourseName = elemSelect.value;
		
		if (newCourseName == NO_COURSE) return;	

		var doCourseSelect = true;;
		
		if (page.dirtyBit) {
			doCourseSelect = _confirmDiscardChanges();
		}
		
		if (doCourseSelect) {
			_getCourseStandards(newCourseName);
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
		var coursename = ssData.standardsData.courseName;
		if (coursename == null || !coursename) return;

		var doReload = true;
		if (page.dirtyBit) {
			doReload = _confirmDiscardChanges();
		}
		
		if (doReload) {
			_getReload(ssData.standardsData.courseName);
		}
	}
	
	function _addButtonClicked(evt) {
		var doAdd = true;
		if (page.dirtyBit) {
			doAdd = _confirmDiscardChanges();
		}
		
		if (doAdd) {
			page.promptshortname.value = '';
			page.promptlongname.value = '';
			_enableAddCoursePrompt(true);
		}
	}

	function _deleteButtonClicked(evt) {
		var coursename = ssData.standardsData.courseName;
		if (coursename == null || !coursename) return;
		
		var longName = ssData.standardsData.standards[ssData.longCourseNameKey];

		var confirmed = confirm('"' + longName + '" will be permanently deleted, and cannot be recovered.  Continue with the deletion?');
		if (confirmed) {
			_postDeleteCourse(coursename);
		}
	}

	return {
		init: init
 	};
}();