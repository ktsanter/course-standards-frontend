const app = function () {
	const API_BASE = 'https://script.google.com/macros/s/AKfycbymCm2GsamiaaWMfMr_o3rK579rz988lFK5uaBaRXVJH_8ViDg/exec';
	const API_KEY = 'MVstandardsAPI';
	const DEPARTMENTS = ['cte', 'english', 'math', 'socialstudies', 'science', 'worldlanguage'];
	const NO_COURSE = 'NO_COURSE';
	const AP_KEY = 'AP';
	const AP_POLICY_DOC = 'https://drive.google.com/open?id=1CnvIf-ZaTD5INn8ACzZi942oRpEE887EuJFipJ5eFNI';

	const page = {};
	const apPolicyDoc = {};
	const ssData = {};

	function init () {
		page.courselist = document.getElementById('courselist');
		page.standards = document.getElementById('standards');
		page.notice = document.getElementById('notice');
		
		document.getElementById('btnTestPost').addEventListener('click', handleTestPostClick, false);
		document.getElementById('btnTestEdit').addEventListener('click', handleTestEditClick, false);
		
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
		_setNotice('posting course standards...');
		var postData = _packageCourseStandardsForPost(coursename);
		//console.log('posting course standards: ' + JSON.stringify(postData));
		
		fetch(_buildApiUrl('standards', coursename), {
				method: 'post',
				body: JSON.stringify(postData)
			})
			.then((response) => response.json())
			.then((json) => {
				console.log('json.status=' + json.status);
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
	
	function _buildApiUrl (datasetname, coursename) {
		let url = API_BASE;
		url += '?key=' + API_KEY;
		url += datasetname !== null ? '&dataset=' + datasetname : '';
		url += coursename !== null ? '&coursename=' + coursename : '';
		//console.log('buildApiUrl: url=' + url);
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
		var fullKeyList = data.categoryInfo.fullKeyList;
		var standardsData = data.standards;
		
		for (var i = 0; i < catList.length; i++) {
			var catKey = catList[i];
			var catElement = _createCategoryElement(catData[catKey]);
			var standardsKeyInfo = catData[catKey].keyList;
			
			for (var j = 0; j < standardsKeyInfo.length; j++) {
				var standardsKey = standardsKeyInfo[j];
				var standard = standardsData[standardsKey];
				catElement.appendChild(_createStandardsElement(standardsKey, fullKeyList[standardsKey], standardsData[standardsKey]));
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
			elemCategoryTitle = document.createElement('span');
			elemCategoryTitle.classList.add('cse-category-title');
			elemCategoryTitle.innerHTML = categoryInfo.prompt;
			elemCategory.appendChild(elemCategoryTitle);
			
		} else {
			elemCategory = document.createElement('span');
		}
		return elemCategory;
	}
	
	function _createStandardsElement(keyName, keyInfo, standardValue) {
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
				
			} else if (keyInfo.keyType == 'link') {
				var linkInfo = JSON.parse(standardValue);
				console.log(keyInfo.keyName + ': ' + JSON.stringify(linkInfo) + ', ' + linkInfo.text);
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
				
			} else {
				elemStandard = document.createElement('div');
				elemStandard.innerHTML = keyInfo.keyName + ' unrecognized type: ' + keyInfo.keyType;
			}
			
			elemWrapper.appendChild(elemStandard);
		}
		
		return elemWrapper;
	}
	
	function _packageCourseStandardsForPost (coursename) {
		//console.log('_packageCourseStandardsForPost: ' + coursename);
		//console.log('courseList: ' + JSON.stringify(ssData.courseList));
		//console.log('standardsData: ' + JSON.stringify(ssData.standardsData));
		
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
		console.log('test post');
		var coursename = document.getElementById('selectCourse').value;
		if (coursename != NO_COURSE) {
			_postCourseStandards(coursename);
		}
	}
	
	function handleTestEditClick() {
		console.log('test edit');
		var coursename = document.getElementById('selectCourse').value;
		if (coursename != NO_COURSE) {
			// change some standards values and then...
			//_postCourseStandards(coursename);
		}
	}
	
	return {
		init: init
 	};
}();