(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	// Create Table to view source information chronologically from 
	// top to bottom.
	slApp.factory('slTbl', [ 'slTxt', function (slTxt) {
		var slTbl = {};


		// These "util" functions are not part of the core
		// functionality but are all necessary - mostly DOM helpers

		var util = {

			elmnt: function (type, attrs) {

				// Create new element
				var elmnt = document.createElement(type), attr;

				// Copy to single object
				attrs = util.merge({}, attrs);

				// Add attributes to elmnt
				if (attrs && attrs.style) {
					var styles = attrs.style;
					util.applyCSS(elmnt, styles);
					delete attrs.style;
				}
				for (attr in attrs) {
					if (attrs.hasOwnProperty(attr)) {
						elmnt[attr] = attrs[attr];
					}
				}

				return elmnt;

			},

			applyCSS: function (elmnt, styles) {
				// Applies CSS to a single element 
				for (var prop in styles) {
					if (styles.hasOwnProperty(prop)) {
						try {
							// Yes, IE6 SUCKS! 
							elmnt.style[prop] = styles[prop];
						} catch (e) { }
					}
				}
			},

			txt: function (t) {
				// Create text node
				return document.createTextNode(t);
			},

			row: function (cells, cellType) {

				// Creates new <tr> 
				cellType = cellType || 'td';

				// colSpan is calculated by length of null items in array 
				var colSpan = util.count(cells, null) + 1,
					tr = util.elmnt('tr'), td,
					attrs = {
						style: util.getStyles(cellType),
						colSpan: colSpan,
						onmouseover: function () {
							var tds = this.parentNode.childNodes;
							util.forEach(tds, function (cell) {
								if (cell.nodeName.toLowerCase() !== 'td') { return; }
								util.applyCSS(cell, util.getStyles('tdHover'));
							});
						},
						onmouseout: function () {
							var tds = this.parentNode.childNodes;
							util.forEach(tds, function (cell) {
								if (cell.nodeName.toLowerCase() !== 'td') { return; }
								util.applyCSS(cell, util.getStyles('td'));
							});
						}
					};

				util.forEach(cells, function (cell) {

					if (cell === null) { return; }
					// Default cell type is <td> 
					td = util.elmnt(cellType, attrs);

					if (cell.nodeType) {
						// IsDomElement 
						td.appendChild(cell);
					} else {
						// IsString 
						td.innerHTML = util.shorten(cell.toString());
					}

					tr.appendChild(td);
				});

				return tr;
			},

			// Don't shorten allow to wrap
			shorten: function (str) {
				//var max = 40;
				str = str.replace(/^\s\s*|\s\s*$|\n/g, '');
				//return str.length > max ? (str.substring(0, max-1) + '...') : str;
				return str;
			},

			htmlentities: function (str) {
				return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			},

			merge: function (target, source) {

				// Merges two (or more) objects,
				// giving the last one precedence 

				if (typeof target !== 'object') {
					target = {};
				}

				for (var property in source) {

					if (source.hasOwnProperty(property)) {

						var sourceProperty = source[property];

						if (typeof sourceProperty === 'object') {
							target[property] = util.merge(target[property], sourceProperty);
							continue;
						}

						target[property] = sourceProperty;

					}

				}

				for (var a = 2, l = arguments.length; a < l; a++) {
					util.merge(target, arguments[a]);
				}

				return target;
			},

			count: function (arr, item) {
				var count = 0;
				for (var i = 0, l = arr.length; i < l; i++) {
					if (arr[i] === item) {
						count++;
					}
				}
				return count;
			},

			thead: function (tbl) {
				return tbl.getElementsByTagName('thead')[0];
			},

			forEach: function (arr, max, fn) {

				if (!fn) {
					fn = max;
				}

				// Helper: iteration 
				var len = arr.length,
					index = -1;

				while (++index < len) {
					if (fn(arr[index], index, arr) === false) {
						break;
					}
				}

				return true;
			},

			within: function (ref) {
				// Check existence of a val within an object
				//   RETURNS KEY 
				return {
					is: function (o) {
						for (var i in ref) {
							if (ref[i] === o) {
								return i;
							}
						}
						return '';
					}
				};
			},

			getStyles: function (elmnt) {
				return mySettings.styles[elmnt];
			},

			expander: function (text, title, clickFn) {
				return util.elmnt('a', {
					innerHTML: util.shorten(text) + ' <b style="visibility:hidden;">[+]</b>',
					title: title,
					onmouseover: function () {
						this.getElementsByTagName('b')[0].style.visibility = 'visible';
					},
					onmouseout: function () {
						this.getElementsByTagName('b')[0].style.visibility = 'hidden';
					},
					onclick: function () {
						this.style.display = 'none';
						clickFn.call(this);
						return false;
					},
					style: {
						cursor: 'pointer'
					}
				});
			},

			
			headerGradient: (function () {

				var canvas = document.createElement('canvas');
				if (!canvas.getContext) { return ''; }
				var cx = canvas.getContext('2d');
				canvas.height = 30;
				canvas.width = 1;

				var linearGrad = cx.createLinearGradient(0, 0, 0, 30);
				linearGrad.addColorStop(0, 'rgba(0,0,0,0)');
				linearGrad.addColorStop(1, 'rgba(0,0,0,0.25)');

				cx.fillStyle = linearGrad;
				cx.fillRect(0, 0, 1, 30);

				var dataURL = canvas.toDataURL && canvas.toDataURL();
				return 'url(' + (dataURL || '') + ')';

			})()

		};

		// Configuration 

		// All items can be overwridden by passing an
		//   "options" object when calling viewSrcs 
		var mySettings = {
			
			styles: {
				table: {
					borderCollapse: 'collapse',
					whiteSpace: 'pre-line',
					width: '100%'
				},
				td: {
					padding: '5px',
					fontSize: '12px',
					backgroundColor: '#FFF',
					color: '#222',
					border: '1px solid #000',
					verticalAlign: 'top',
					fontFamily: '"Consolas","Lucida Console",Courier,mono',
					whiteSpace: 'pre-line'
				},
				tdS: {
					padding: '5px',
					fontSize: '12px',
					backgroundColor: '#EFE',
					color: '#121',
					border: '1px solid #000',
					verticalAlign: 'top',
					fontFamily: '"Consolas","Lucida Console",Courier,mono',
					whiteSpace: 'pre-line'
				},
				tdL: {
					padding: '5px',
					fontSize: '12px',
					backgroundColor: '#EEF',
					color: '#112',
					border: '1px solid #000',
					verticalAlign: 'top',
					fontFamily: '"Consolas","Lucida Console",Courier,mono',
					whiteSpace: 'pre-line'
				},
				tdA: {
					padding: '5px',
					fontSize: '12px',
					backgroundColor: '#EEF',
					color: '#112',
					border: '1px solid #000',
					verticalAlign: 'top',
					fontFamily: '"Consolas","Lucida Console",Courier,mono',
					whiteSpace: 'pre-line'
				},
				tdHover: {
					whiteSpace: 'pre-line'
					// Styles defined here will apply to all tr:hover > td,
					//	- Be aware that "inheritable" properties (e.g. fontWeight) WILL BE INHERITED 
				},
				th: {
					padding: '5px',
					fontSize: '12px',
					backgroundColor: '#AAA',
					color: '#000',
					textAlign: 'left',
					border: '1px solid #000',
					verticalAlign: 'top',
					fontFamily: '"Consolas","Lucida Console",Courier,mono',
					whiteSpace: 'pre-line',
					backgroundImage: util.headerGradient,
					backgroundRepeat: 'repeat-x'
				},
				thS: {
					padding: '5px',
					fontSize: '12px',
					backgroundColor: '#9B9',
					color: '#000',
					textAlign: 'left',
					border: '1px solid #000',
					verticalAlign: 'top',
					fontFamily: '"Consolas","Lucida Console",Courier,mono',
					whiteSpace: 'pre-line',
					backgroundImage: util.headerGradient,
					backgroundRepeat: 'repeat-x'
				},
				thA: {
					padding: '5px',
					fontSize: '12px',
					backgroundColor: '#99B',
					color: '#000',
					textAlign: 'left',
					border: '1px solid #000',
					verticalAlign: 'top',
					fontFamily: '"Consolas","Lucida Console",Courier,mono',
					whiteSpace: 'pre-line',
					backgroundImage: util.headerGradient,
					backgroundRepeat: 'repeat-x'
				}
			}
		};

		var tblAtt = { style: util.getStyles('table') };
		var tdAtt = { style: util.getStyles('td') };	// standard cell attribute
		var tdSAtt = { style: util.getStyles('tdS') };	// Selected standard cell attribute
		var tdLAtt = { style: util.getStyles('tdL') };	// Label standard cell attribute
		var tdAAtt = { style: util.getStyles('tdA') };	// Active Person standard cell attribute 
		var thAtt = { style: util.getStyles('th') };	// header cell attribute
		var thSAtt = { style: util.getStyles('thS') };	// Selected header cell attribute
		var thAAtt = { style: util.getStyles('thA') };	// Active Person header cell attribute
		var trHeader;
		var eventYear = '';
		
		var createHeader = function (tbl, att) {
			trHeader = util.elmnt('tr');
			tbl.appendChild(trHeader);
			var th = util.elmnt('th', att);
			trHeader.appendChild(th);
		};

		var addTitle = function (title, att, columns) {
			var th = util.elmnt('th', att);
			if (columns > 1) {
				th.colSpan = columns;
			}
			th.innerHTML = title;
			trHeader.appendChild(th);
		};

		var appendCell = function (row, value, att) {
			var cell = util.elmnt('td', att);
			cell.innerHTML = value;
			row.appendChild(cell);
		};

		// create a row with label/value pair
		var createRow = function (tbl, label, value, extValue, id) {
			var tr = util.elmnt('tr');
			if (id) {
				tr.id = id;
			}
			tbl.appendChild(tr);
			appendCell(tr, label, tdLAtt);
			appendCell(tr, value, tdSAtt);
			if (extValue) {
				appendCell(tr, extValue, tdSAtt);
			}
			return tr;
		};

		var createEventRows = function (tbl, type, event, extValue) {
			
			var row;
			if (event.date) {
				var eventDate = slTxt.date(event.date);
				createRow(tbl, type + 'Date', eventDate, extValue);
				eventYear = slTxt.year(event.date);
			}
			if (event.place) {
				var len = event.place.length;
				var cnt = 0;
				for (var i = 0; i < len; i++) {
					if (slTxt.isValid(event.place[i])) {
						createRow(tbl, type + 'Place' + (++cnt), event.place[i], extValue);
					}
				}
			}
		};

		// create rows from label/obj pair 
		var createRows = function (tbl, label, obj, extValue) {
			if (obj.date || obj.place) {
				createEventRows(tbl, label, obj, extValue);
			}
		};


/*
		var getRow = function (tbl,label) {
			return document.getElementById(label);
		};


		var addCell = function (tr, which, value) {
			for (var i = tr.cells.length - 1; i <= which; ++i) {
				tr.insertCell(-1);
			}
			tr.cells[i] = value;
		};
*/

		var skipEvent = ['birth'];

		var eventIsUnique = function (source, srcPerson, type) {
			if (skipEvent.indexOf(type) >= 0) {
				return false;
			}
			if (source.event) {
				if (srcPerson && srcPerson[type]) {
					return false;
				}
				return true;
			}
			return false;
		};

		var skipProps = ['key', 'id', 'name', 'type', 'country', 'url', 'added'];

		var skipProp = function (prop) {
			if (skipProps.indexOf(prop) >= 0 ||
				(prop.indexOf('father') === 0) ||
				(prop.indexOf('mother') === 0) ||
				(prop.indexOf('place') === 0)) {
				return true;
			}
			return false;
		};

		var setRows = function (person, source, tbl, extValue) {
			var type;
			var row;
			if (source.type) {
				type = slTxt.toCamelCase(source.type);
				if (source.title.toLowerCase().indexOf(type) < 0) {
					createRow(tbl, 'eventType', source.type, extValue);
				}
			}
			var srcPerson;
			if (source.attPeople) {
				srcPerson = source.attPeople.get(person.id);
			}
			eventYear = '';
			if (eventIsUnique(source, srcPerson, type)) {
				createEventRows(tbl, type ? type : 'event', source.event, extValue);
			}
			if (srcPerson) {
				if (srcPerson.name) {
					if (srcPerson.name[1]) {
						createRow(tbl, '$urName', srcPerson.name[1], extValue);
					}
					if (srcPerson.name[0]) {
						createRow(tbl, 'givenName', srcPerson.name[0], extValue);
					}
				}
			}
			var foundRelation = false;
			for (var prop in srcPerson) {
				if (srcPerson.hasOwnProperty(prop)) {
					if (skipProp(prop)) {
						continue;
					}
					var info = srcPerson[prop];
					if (prop.indexOf('relation') === 0) {
						if (foundRelation) {
							continue;
						}
						foundRelation = true;
						createRow(tbl, 'relation', info, extValue);
						continue;
					}
					
					var infoType = typeof info;
					if (infoType !== 'object') {
						createRow(tbl, prop, info, extValue);

					} else {
						createRows(tbl, prop, info, extValue);
					}
				}
			}
		};

		var incrCellCnt = function (cell, which) {
			var cnt;
			if (which === undefined) {
				cnt = Number(cell.innerHTML);
				cell.innerHTML = ++cnt;
			} else {
				var cellText = cell.innerHTML;
				var entries = cellText.split('<br>');
				cnt = Number(entries[which]);
				entries[which] = (++cnt).toString();
				cell.innerHTML = entries.join('<br>');
			}
		};

		var cellContainsValue = function (cellText, value) {
			var entries = cellText.split('<br>');
			return entries.indexOf(value);
		};

		var updateCell = function (cells, idx, value, matchOnly) {
			if (cells[idx].innerHTML === value) {
				incrCellCnt(cells[idx + 1]);
			} else {
				if (matchOnly) {
					return false;
				}
				var which = cellContainsValue(cells[idx].innerHTML, value);
				if (which >= 0) {
					incrCellCnt(cells[idx + 1],which);
				} else {
					cells[idx].innerHTML += '<br>' + value;
					cells[idx + 1].innerHTML += '<br>1';
				}
			}
			return true;
		};

		// create a row with label/value pair
		var updateRow = function (tbl, rowIdx, label, value, matchOnly) {
			var rows = tbl.rows;
			var rlen = rows.length;
			for (var i = rowIdx; i < rlen; i++) {
				var row = rows[i];
				var cells = row.cells;
				if (cells[0].innerHTML === label) {
					if (updateCell(cells, 1, value, matchOnly)) {
						rowIdx = i + 1;
						return rowIdx;
					}
				}
			}
			createRow(tbl, label, value, 1);
			return rowIdx;
		};

		var updateEventRows = function (tbl, rowIdx, type, event, extValue) {
			if (event.date) {
				var eventDate = slTxt.date(event.date);
				rowIdx = updateRow(tbl, rowIdx, type + 'Date', eventDate, extValue);
				eventYear = slTxt.year(event.date);
			}
			if (event.place) {
				var len = event.place.length;
				var cnt = 0;
				for (var i = 0; i < len; i++) {
					if (slTxt.isValid(event.place[i])) {
						rowIdx = updateRow(tbl, rowIdx, type + 'Place' + (++cnt), event.place[i], extValue);
					}
				}
			}
			return rowIdx;
		};

		// create rows from label/obj pair 
		var updateRows = function (tbl, rowIdx, label, obj) {
			if (obj.date || obj.place) {
				rowIdx = updateEventRows(tbl, rowIdx, label, obj);
			}
			return rowIdx;
		};

		// update reference source rows with other sources in the
		// same source group.  Either alternate values are listed
		// within the same row OR a confirmation count will be incremented
		// at the end of equal values and displayed within square brackets
		var updateRef = function (person, source, tbl) {
			var rowIdx = 0;
			var srcPerson;
			if (source.attPeople) {
				srcPerson = source.attPeople.get(person.id);
			}
			var type;
			if (source.type) {
				type = slTxt.toCamelCase(source.type);
			}
			if (eventIsUnique(source, srcPerson, type)) {
				rowIdx = updateEventRows(tbl, rowIdx, type ? type : 'event', source.event);
			}
			if (srcPerson) {
				if (srcPerson.name) {
					if (srcPerson.name[1]) {
						rowIdx = updateRow(tbl, rowIdx, '$urName', srcPerson.name[1]);
					}
					if (srcPerson.name[0]) {
						rowIdx = updateRow(tbl, rowIdx, 'givenName', srcPerson.name[0]);
					}
				}
			}
			var foundRelation = false;
			for (var prop in srcPerson) {
				if (srcPerson.hasOwnProperty(prop)) {
					if (skipProp(prop)) {
						continue;
					}
					var info = srcPerson[prop];
					if (prop.indexOf('relation') === 0) {
						if (foundRelation) {
							continue;
						}
						foundRelation = true;
						updateRow(tbl, rowIdx, 'relation', info);
						continue;
					}

					var infoType = typeof info;
					if (infoType !== 'object') {
						updateRow(tbl, rowIdx, prop, info);
					} else {
						updateRows(tbl, rowIdx, prop, info);
					}
				}
			}
		};

		var updatePeopleRows = function (person, source, tbl, rowIdx) {
			var surName = person.name ? person.name[1] : undefined;
			var len = source.people.length;
			for (var i = 0; i < len; i++) {
				var srcPerson = source.people[i];
				if (srcPerson.id !== person.id) {
					updatePersonRow(source.people[i], surName, tbl, rowIdx);
				}
			}
		};

		var birthYear = function(person) {
			var year;
			if (person.birth && person.birth.date) {
				year = slTxt.year(person.birth.date);
				if (slTxt.isValid(year)) {
					return year;
				}
			}
			if (person.age) {
				return eventYear - person.age;
			}
			return undefined;
		};

		var birthPlace = function(person) {
			if (person.birth && person.birth.place) {
				var txt = [''];
				slTxt.addPlace(person.birth.place,txt);
				return txt[0];
			}
			if (person.birthPlace) {
				return person.birthPlace;
			}
			return undefined;
		};

		var genderLabel = function(gender) {
			if (gender) {
				if (gender === 'M') {
					return 'male';
				}
				if (gender === 'F') {
					return 'female';
				}
			}
			return 'person';
		};

		var personText = function (person, surName) {
			var txt = '';
			if (person.name) {
				if (typeof person.name === 'string') {
					var snLoc = person.name.lastIndexOf(surName);
					if (snLoc > 0) {
						txt += person.name.substring(0, snLoc) + '$ ';
					} else {
						txt += person.name + ' ';
					}
				} else {
					txt += person.name[0];
					if (txt.length > 0) {
						txt += ' ';
					}
					if (person.name[1]) {
						if (surName &&
							person.name[1] === surName) {
							txt += '$ ';
						} else {
							txt += person.name[1] + ' ';
						}
					}
				}
				var bY = birthYear(person, eventYear);
				if (bY) {
					txt += bY + ' ';
				}
				var bp = birthPlace(person);
				if (bp) {
					txt += ' ' + bp;
				}
			}
			return txt;
		};

		var setPersonRow = function (person, surName, tbl, extValue) {
			// relation: name, gender, birthYear, birthPlace
			var label = person.relation ? person.relation : genderLabel(person.gender);
			var txt = personText(person,surName);
			createRow(tbl, label, txt, extValue, person.id);
		};

		var updatePersonRow = function (person, surName, tbl, rowIdx) {
			// relation: name, gender, birthYear, birthPlace
			var txt = personText(person, surName);
			if (person.id) {
				var row = document.getElementById(person.id);
				if (row) {
					updateCell(row.cells, 1, txt);
					return;
				}
			}
			var label = person.relation ? person.relation : genderLabel(person.gender);
			updateRow(tbl, rowIdx, label, txt, true);
		};

		var setPeopleRows = function (person, source, tbl, extValue) {
			var surName = person.name ? person.name[1] : undefined;
			var len = source.people.length;
			for (var i = 0; i < len; i++) {
				var srcPerson = source.people[i];
				if (srcPerson.id !== person.id) {
					setPersonRow(source.people[i], surName, tbl, extValue);
				}
			}
		};

		var showRefSources = function (tbl, person, sources, title) {
			var len = sources.length;
			var extValue = len > 1 ? 1 : undefined;
			var thead = util.elmnt('thead', thSAtt);
			var tbody = util.elmnt('tbody');
			tbl.appendChild(thead);
			createHeader(thead, thAtt);
			addTitle(title, thSAtt, len > 1 ? 2 : 1);
			tbl.appendChild(tbody);
			var i;
			setRows(person, sources[0], tbody, extValue);
			for (i = 1; i < len; i++) {
				updateRef(person, sources[i], tbody);
			}
			var rowIdx = tbody.rows.length;
			setPeopleRows(person, sources[0], tbody, extValue);
			for (i = 1; i < len; i++) {
				updatePeopleRows(person, sources[i], tbody, rowIdx);
			}
		};

		var showFamTree = function (tbl, person) {

		};
		

		slTbl.sourceGrp = function (person, srcGrp, slSrc) {
			var sources = slSrc.grpToSources(srcGrp);
			var title = slSrc.title(sources[0], sources.length);
			slTxt.view();
			var disp = slTxt.underDisp();
			var container = util.elmnt('div');
			var tbl = util.elmnt('table', tblAtt);
			container.appendChild(tbl);
			disp.append(container);
			showRefSources(tbl, person, sources, title);
			showFamTree(tbl, person);
		};

		slTbl.viewSrcs = function (person,sourceId,slSrc) {
			//
			//  person:		person sources are attached to					
			//  sourceId:	source which is compared to person's
			//				information as well as all other sources

			var source = slSrc.get(sourceId);

		};

		return slTbl;
	}]);

})();
