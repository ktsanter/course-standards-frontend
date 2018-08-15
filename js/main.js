const app = function () {
	//const API_BASE = 'https://script.google.com/macros/s/AKfycbymCm2GsamiaaWMfMr_o3rK579rz988lFK5uaBaRXVJH_8ViDg/exec';
	const API_BASE = 'https://script.google.com/macros/s/AKfycbymCm2GsamiaaWMfMr_o3rK579rz988lFK5uaBaRXVJH_8ViDg/exec'
	const API_KEY = 'abcdef';
	const DEPARTMENTS = ['cte', 'english', 'math', 'socialstudies', 'science', 'worldlanguage'];

	const state = {};
	const page = {};

	function init () {
		page.container = document.getElementById('container');
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
				console.log('json.status=' + json.status);
				if (json.status !== 'success') {
					_setNotice(json.message);
				}
				console.log('json.data: ' + JSON.stringify(json.data));
				_renderCourseList(json.data);
				_setNotice('');
			})
			.catch((error) => {
				_setNotice('Unexpected error loading course list');
			})
	}

	function _buildApiUrl (datasetname) {
		let url = API_BASE;
		url += '?key=' + API_KEY;
		url += datasetname !== null ? '&dataset=' + datasetname : '';
		console.log('url=' + url);
		return url;
	}

	function _setNotice (label) {
		page.notice.innerHTML = label;
	}

	function _renderCourseList(data) {
		var elemSelect = document.createElement('select');
		elemSelect.id = 'selectCourse';
		
		var test = document.createElement('option');
		
		for (var i = 0; i < data.length; i++) {
			var elemOption = document.createElement('option');
			elemOption.text = data[i].long;
			elemOption.value = data[i].short;
			if (i == 0) elemOption.selected = true;
			elemSelect.appendChild(elemOption);
		}
		elemSelect.addEventListener('change', courseSelectChanged, false);

		page.container.appendChild(elemSelect);
	}
	
	function courseSelectChanged() {
		console.log('courseSelectChanged: ' + document.getElementById('selectCourse').value);
	}
	
	return {
		init: init
 	};
}();