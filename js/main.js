const app = function () {
	const API_BASE = 'https://script.google.com/macros/s/AKfycbymCm2GsamiaaWMfMr_o3rK579rz988lFK5uaBaRXVJH_8ViDg/exec'
	const API_KEY = 'abcdef';
	const DEPARTMENTS = ['cte', 'english', 'math', 'socialstudies', 'science', 'worldlanguage'];
	const NO_COURSE = 'NO_COURSE';

	const state = {};
	const page = {};

	function init () {
		page.courselist = document.getElementById('courselist');
		page.standards = document.getElementById('standards');
		page.notice = document.getElementById('notice');
		
		_getCourseList();
	}

	function _getCourseList () {
		page.content.innerHTML = '';
		_getCourseList();
	}

	function _getCourseList () {
		_setNotice('Loading course list');

		fetch(_buildApiUrl('courselist'))
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				_renderCourseList(json.data);
				_setNotice('');
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
				console.log(error);
			})
	}

	function _getCourseStandards (coursename) {
		_setNotice('Loading course standards for ' + coursename);

		fetch(_buildApiUrl('standards', coursename))
			.then((response) => response.json())
			.then((json) => {
				//console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				//console.log('json.data: ' + JSON.stringify(json.data));
				_renderCourseStandards(json.data);
				_setNotice('');
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course standards');
				console.log(error);
			})
	}

	function _buildApiUrl (datasetname, coursename) {
		let url = API_BASE;
		url += '?key=' + API_KEY;
		url += datasetname !== null ? '&dataset=' + datasetname : '';
		url += coursename !== null ? '&coursename=' + coursename : '';
		//console.log('url=' + url);
		return url;
	}

	function _setNotice (label) {
		page.notice.innerHTML = label;
	}

	function _renderCourseList(data) {
		var elemSelect = document.createElement('select');
		elemSelect.id = 'selectCourse';
		
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

		page.courselist.appendChild(elemSelect);
	}
	
	function _renderCourseStandards(data) {
		_removeCourseStandards();
		var catList = data.categoryInfo.categoryList;
		var catData = data.categoryInfo.categories;
		var standardsData = data.standards;
		
		for (var i = 0; i < catList.length; i++) {
			var catKey = catList[i];
			var catElement = _createCategoryElement(catData[catKey]);
			
			var standardsKeyInfo = catData[catKey].keyInfo;
			for (var j = 0; j < standardsKeyInfo.length; j++) {
				var standardsKey = standardsKeyInfo[j];
				var standard = standardsData[standardsKey.keyName];
				catElement.appendChild(_createStandardsElement(standardsKey, standard));
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
			elemCategory = document.createElement('div');
			elemCategory.innerHTML = categoryInfo.prompt;
		} else {
			elemCategory = document.createElement('span');
		}
		return elemCategory;
	}
	
	function _createStandardsElement(keyInfo, standardValue) {
		var elemWrapper = document.createElement('span');
		
		if (keyInfo.keyDisplay) {
			var elemStandard;
			
			if (keyInfo.keyType == 'text') {
				elemStandard = document.createElement('div');
				elemStandard.innerHTML = '  ' + keyInfo.keyPrompt + ' ' + standardValue;
				
			} else if (keyInfo.keyType == 'tf') {
				elemStandard = document.createElement('div');
				var elemPrompt = document.createElement('span');
				elemPrompt.innerHTML = keyInfo.keyPrompt;
				var elemCheckbox = document.createElement('input');
				elemCheckbox.type = 'checkbox';
				elemCheckbox.disabled = true;
				
				elemStandard.appendChild(elemPrompt);
				elemStandard.appendChild(elemCheckbox);
				
			} else {
				elemStandard = document.createElement('div');
				elemStandard.innerHTML = keyInfo.keyName + ' unrecognized type: ' + keyInfo.keyType;
			}
			
			elemWrapper.appendChild(elemStandard);
		}
		
		return elemWrapper;
	}
	
	function courseSelectChanged(data) {
		var newCourseName = document.getElementById('selectCourse').value;
		
		if (newCourseName == NO_COURSE) return;
		
		_getCourseStandards (newCourseName);
	}
	
	return {
		init: init
 	};
}();