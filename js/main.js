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
		
		_getCourseList();
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
				_renderCourseList(json.data);
				_setNotice('');
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
				console.log(error);
			})
	}

	function _getCourseStandards (coursename) {
		_setNotice('loading course standards...');
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
				_setNotice('Unexpected error loading course standards');
				console.log(error);
			})
	}

	function _postCourseStandards (coursename) {
		_setNotice('posting course standards');
		var postData = _packageCourseStandardsForPost(coursename);
		//console.log('posting course standards: ' + JSON.stringify(postData));
			console.log('actual posting disabled');
			_setNotice('');
			return;
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
				
				_getCourseStandards(coursename);
			})
			.catch((error) => {
				_setNotice('Unexpected error posting course standards');
				console.log(error);
			})
	}
	
	function _buildApiUrl (datasetname, coursename, keyname) {
		let url = API_BASE;
		url += '?key=' + API_KEY;
		url += datasetname && datasetname !== null ? '&dataset=' + datasetname : '';
		url += coursename && coursename !== null ? '&coursename=' + coursename : '';
		url += keyname && keyname !== null ? '&keyname=' + keyname : '';
		//console.log('buildApiUrl: url=' + url);
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
		elemSelect.addEventListener('change', courseSelectChanged, false);

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
		
		_renderSaveButton();
	}
	
	function _removeCourseStandards() {
		while (page.standards.firstChild) {
			page.standards.removeChild(page.standards.firstChild);
		}
		
		var elemSave = page.savebutton;
		if (typeof(elemSave) != 'undefined' && elemSave != null) {
			page.savebutton.parentNode.removeChild(elemSave);
			page.savebutton = null;
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
		elemCheckbox.id = keyName;
		elemCheckbox.classList.add('cse-standards-tf');
		elemCheckbox.classList.add(SAVE_ME_CLASS);
		elemCheckbox.type = 'checkbox';
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
		//TODO: implement editing and saving as need arises
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
	
	function _renderSaveButton() {
		var elemSave = document.createElement('button');
		elemSave.id = 'btnSave';
		elemSave.classList.add('cse-control');
		elemSave.innerHTML = 'save';
		elemSave.addEventListener('click', saveButtonClicked, false);

		page.savebutton = elemSave;
		page.header.appendChild(elemSave);
	}
	
	function _packageCourseStandardsForPost (coursename) {	
		var standards = ssData.standardsData.standards;
		var fullKeyList = ssData.standardsData.categoryInfo.fullKeyList;
		copyCurrentValuesToStandards(coursename, standards);
		
		var postData = {
			"coursename": ssData.standardsData.courseName,
			"courseRowNumber": ssData.standardsData.courseRowNumber, 
			"standards": {}};
			
		for (var standardsKey in standards) {
			postData.standards[standardsKey] = {
				"colNumber": fullKeyList[standardsKey].keyIndex,
				"value": standards[standardsKey]
			};
		}
		
		return postData;
	}
	
	function copyCurrentValuesToStandards(coursename, standards) {
		var saveElements = document.getElementsByClassName(SAVE_ME_CLASS);
		for (var i = 0; i < saveElements.length; i++) {
			var elem = saveElements.item(i);
			var value;
			if (elem.type == 'text') {
				value = elem.value;
			} else if (elem.type == 'checkbox') {
				value = (elem.value == 'on');
			} else {
				value = '????';
			}
			console.log('save #' + i + ': ' + elem.id + ' value=' + value);
		}
	}
	
	function courseSelectChanged(data) {
		var newCourseName = document.getElementById('selectCourse').value;
		
		if (newCourseName == NO_COURSE) return;	
		
		_getCourseStandards (newCourseName);
	}
	
	function saveButtonClicked() {
		var courseName = document.getElementById('selectCourse').value;
		_postCourseStandards(courseName);
	}
	
	return {
		init: init
 	};
}();