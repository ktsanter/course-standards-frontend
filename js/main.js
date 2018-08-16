const app = function () {
	const PAGE_TITLE = 'Course standards editor'
	const PAGE_VERSION = 'v0.1';
	
	const API_BASE = 'https://script.google.com/macros/s/AKfycbymCm2GsamiaaWMfMr_o3rK579rz988lFK5uaBaRXVJH_8ViDg/exec';
	const API_KEY = 'MVstandardsAPI';
	const DEPARTMENTS = ['cte', 'english', 'math', 'socialstudies', 'science', 'worldlanguage'];
	const NO_COURSE = 'NO_COURSE';
	const NO_SELECTION = 'NO_SELECTION';
	const AP_KEY = 'AP';
	const AP_POLICY_DOC = 'https://drive.google.com/open?id=1CnvIf-ZaTD5INn8ACzZi942oRpEE887EuJFipJ5eFNI';
	const HEAVY_X_CODE = ' &#10006;';
	const DOWN_ARROW_CODE = '&#9660;';

	const page = {};
	const apPolicyDoc = {};
	const ssData = {};

	function init () {
		page.header = document.getElementById('header');
		page.courselist = document.getElementById('courselist');
		page.standards = document.getElementById('standards');
		page.notice = document.getElementById('notice');
		
		_renderHeader();
		
		/* test buttons */
		document.getElementById('btnTestPost').addEventListener('click', handleTestPostClick, false);
		document.getElementById('btnTestEdit').addEventListener('click', handleTestEditClick, false);
		/* end of test buttons */
		
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

	function _getStandardsSelections (keyname) {
		_setNotice('loading selections...');

		fetch(_buildApiUrl('selections', null, keyname))
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				
				_renderStandardsSelection(keyname, json.data);
				_setNotice('');
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course standards');
				console.log(error);
			})
	}

	function _postCourseStandards (coursename) {
		_setNotice('posting course standards...');
		var postData = _packageCourseStandardsForPost(coursename);
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
				console.log('json.data: ' + JSON.stringify(json.data));
				
				_setNotice('');
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

		//page.courselist.appendChild(elemSelect);
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
			
			page.standards.appendChild(document.createElement('br'));
			page.standards.appendChild(catElement);
		}
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
		elemValue.maxLength = 200;
		elemValue.size = 40;
		
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
		var elemListName = 'selections' + keyName;
		elemList.setAttribute('list', elemListName);
		elemList.classList.add('cse-standards-list');
		
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
		elemCheckbox.type = 'checkbox';
		elemCheckbox.checked = standardValue;
				
		elemStandard.appendChild(elemPrompt);
		elemStandard.appendChild(elemCheckbox);
		
		if (keyInfo.keyName == AP_KEY  && standardValue) {
			var elemLink = document.createElement('a');
			elemLink.text = apPolicyDoc.text;
			elemLink.href = apPolicyDoc.link;
			elemLink.target = "_blank";
			elemStandard.appendChild(elemLink);
		}				
		return elemStandard;
	}

				
	function _createStandardsElement_link(keyName, keyInfo, standardValue) {
		var elemStandard = document.createElement('div');
		elemStandard.classList.add('cse-standards');

		var linkInfo = JSON.parse(standardValue);
		//console.log(keyInfo.keyName + ': ' + JSON.stringify(linkInfo) + ', ' + linkInfo.text);
		if (linkInfo.text) {
			elemStandard = document.createElement('div');
			var elemLink = document.createElement('a');
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
	
	function _renderStandardsSelection(keyname, data) {
		var selections = data.selections;	
		var currentValue = document.getElementById(keyname).value;
		
		var elemWrapper = document.createElement('div');
		elemWrapper.classList.add('cse-selections-wrapper');

		var elemSelect = document.createElement('select');
		elemSelect.id = 'select' + keyname;
		
		for (var i = 0; i < selections.length; i++) {
			var elemOption = document.createElement('option');
			elemOption.text = selections[i];
			elemOption.value = 'optSelect' + i;
			elemOption.id = elemOption.value;
			elemOption.selected = (currentValue == selections[i]);
			elemSelect.append(elemOption);
		}
		elemSelect.addEventListener('change', function() {selectOptionChanged(this, keyname)}, false);
		
		elemWrapper.appendChild(elemSelect);
		document.getElementById(keyname).parentNode.appendChild(elemWrapper);
	}
	
	function _packageCourseStandardsForPost (coursename) {		
		var standards = ssData.standardsData.standards;
		var fullKeyList = ssData.standardsData.categoryInfo.fullKeyList;
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
	
	function courseSelectChanged(data) {
		var newCourseName = document.getElementById('selectCourse').value;
		
		if (newCourseName == NO_COURSE) return;
		
		_getCourseStandards (newCourseName);
	}
	
	function handleTestPostClick() {
		console.log('disabled');
		return;
		console.log('test post');
		var coursename = document.getElementById('selectCourse').value;
		if (coursename != NO_COURSE) {
			_postCourseStandards(coursename);
		}
	}
	
	function handleTestEditClick() {
		console.log('disabled');
		return;
		console.log('test edit');
		var coursename = document.getElementById('selectCourse').value;
		if (coursename != NO_COURSE) {
			var standards = ssData.standardsData.standards;
			standards['DB_requiredreplies'] = 5;
			_postCourseStandards(coursename);
			//_getCourseStandards(coursename);
		}
	}
	
	return {
		init: init
 	};
}();