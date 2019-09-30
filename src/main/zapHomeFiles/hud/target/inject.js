/*
 * Injection Module
 *
 * Description goes here...
 */

const injection = (function () {
	// Injected strings
	const URL = '<<URL>>';
	const ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
	const ZAP_SHARED_SECRET = '<<ZAP_SHARED_SECRET>>';

	const HUD_PREFIX = 'zap-hud-';
	const LEFT_PANEL = HUD_PREFIX + 'left-panel';
	const RIGHT_PANEL = HUD_PREFIX + 'right-panel';
	const BOTTOM_DRAWER = HUD_PREFIX + 'bottom-drawer';
	const MAIN_DISPLAY = HUD_PREFIX + 'main-display';
	const GROWLER_ALERTS = HUD_PREFIX + 'growler-alerts';
	const MANAGEMENT = HUD_PREFIX + 'management';

	let tabId = '';

	/* HELPERS */
	function isFromTrustedOrigin(message) {
		return (
			message.origin === 'https://zap' ||
			message.isTrusted
		);
	}

	function generateTabId() {
		const millis = new Date().getTime();
		const r = Math.floor(Math.random() * 1000);
		const tabId = String(millis) + '-' + r;

		return tabId.substring(6);
	}

	/* TARGET INTERACTIONS */
	// code that will interact with the target domain will go here

	function showPanel(_panel) {
		return 0;
	}

	/* Change width of iframe for expanding buttons */
	function expandPanel(panelOrientation) {
		// Todo: is this too hacky?
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.width = '300px';
	}

	function contractPanel(panelOrientation) {
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.width = '110px';
	}

	/* Dynamically size growler iframes with number of alerts */
	function heightenGrowlerFrame(lines) {
		const panel = document.getElementById(GROWLER_ALERTS);
		const offset = 56 + (30 * lines);

		panel.style.height = (panel.offsetHeight + offset) + 'px';
	}

	function shortenGrowlerFrame(lines) {
		const panel = document.getElementById(GROWLER_ALERTS);
		const offset = 56 + (30 * lines);

		panel.style.height = (panel.offsetHeight - offset) + 'px';
	}

	/* Dynamically size iframes with number of buttons */
	function heighten(panelOrientation) {
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.height = (panel.offsetHeight + 33) + 'px';
	}

	function shorten(panelOrientation) {
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.height = (panel.offsetHeight - 33) + 'px';
	}

	function showHudPanels() {
		document.getElementById(LEFT_PANEL).style.display = '';
		document.getElementById(RIGHT_PANEL).style.display = '';
		const panel = document.getElementById(BOTTOM_DRAWER);
		panel.style.width = '100%';
		panel.style.left = '0px';
		panel.style.right = '';
	}

	function hideHudPanels() {
		document.getElementById(LEFT_PANEL).style.display = 'none';
		document.getElementById(RIGHT_PANEL).style.display = 'none';
		const panel = document.getElementById(BOTTOM_DRAWER);
		panel.style.width = '90px';
		panel.style.left = '';
		panel.style.right = '0px';
	}

	function hideAllDisplayFrames() {
		document.getElementById(LEFT_PANEL).style.display = 'none';
		document.getElementById(RIGHT_PANEL).style.display = 'none';
		document.getElementById(BOTTOM_DRAWER).style.display = 'none';
		document.getElementById(GROWLER_ALERTS).style.display = 'none';
	}

	function showAllDisplayFrames() {
		document.getElementById(LEFT_PANEL).style.display = '';
		document.getElementById(RIGHT_PANEL).style.display = '';
		document.getElementById(BOTTOM_DRAWER).style.display = '';
		document.getElementById(GROWLER_ALERTS).style.display = '';
	}

	function refreshAllFrames() {
		document.getElementById(LEFT_PANEL).src = document.getElementById(LEFT_PANEL).src;
		document.getElementById(RIGHT_PANEL).src = document.getElementById(RIGHT_PANEL).src;
		document.getElementById(MAIN_DISPLAY).src = document.getElementById(MAIN_DISPLAY).src;
		document.getElementById(BOTTOM_DRAWER).src = document.getElementById(BOTTOM_DRAWER).src;
		document.getElementById(GROWLER_ALERTS).src = document.getElementById(GROWLER_ALERTS).src;
		document.getElementById(MANAGEMENT).src = document.getElementById(MANAGEMENT).src;
	}

	function refreshDisplayFrames() {
		document.getElementById(LEFT_PANEL).src = document.getElementById(LEFT_PANEL).src;
		document.getElementById(RIGHT_PANEL).src = document.getElementById(RIGHT_PANEL).src;
		document.getElementById(MAIN_DISPLAY).src = document.getElementById(MAIN_DISPLAY).src;
		document.getElementById(BOTTOM_DRAWER).src = document.getElementById(BOTTOM_DRAWER).src;
		document.getElementById(GROWLER_ALERTS).src = document.getElementById(GROWLER_ALERTS).src;
	}

	function refreshManagementFrame() {
		document.getElementById(MANAGEMENT).src = document.getElementById(MANAGEMENT).src;
	}

	/* Hide or show main iframe for popups and dialogs */
	function showMainDisplay() {
		document.getElementById(MAIN_DISPLAY).style.display = '';
	}

	function hideMainDisplay() {
		document.getElementById(MAIN_DISPLAY).style.display = 'none';
	}

	function showBottomDrawer() {
		document.getElementById(BOTTOM_DRAWER).style.height = '30%';
	}

	function hideBottomDrawer() {
		document.getElementById(BOTTOM_DRAWER).style.height = '50px';
	}

	function expandManagement() {
		document.getElementById(MANAGEMENT).style.width = '100%';
		document.getElementById(MANAGEMENT).style.height = '100%';
	}

	function contractManagement() {
		document.getElementById(MANAGEMENT).style.width = '0px';
		document.getElementById(MANAGEMENT).style.height = '0px';
	}

	// TODO put this code in a separate file and inject ?
	let showEnabled = false;
	let showEnabledCount = 0;
	let showEnableTypeHiddenFields = [];
	let showEnableDisplayNoneFields = [];
	let showEnableDisplayHiddenFields = [];
	let showEnabledDisabled = [];
	let showEnabledReadOnly = [];

	function showEnableOn() {
		const inputs = document.querySelectorAll('input');
		let index;

		for (index = 0; index < inputs.length; ++index) {
			let counted = false;
			if (inputs[index].disabled) {
				inputs[index].disabled = false;
				inputs[index].style.borderColor = 'blue';
				showEnabledDisabled.push(inputs[index]);
				// We dont count disabled fields as they are still visible
			}

			if (inputs[index].readOnly) {
				inputs[index].readOnly = false;
				inputs[index].style.borderColor = 'blue';
				showEnabledReadOnly.push(inputs[index]);
				// We dont count readonly fields as they are still visible
			}

			if (inputs[index].type === 'hidden') {
				inputs[index].type = '';
				inputs[index].style.borderColor = 'purple';
				showEnableTypeHiddenFields.push(inputs[index]);
				showEnabledCount++;
				counted = true;
			}

			if (inputs[index].style.display === 'none') {
				inputs[index].style.display = '';
				inputs[index].style.borderColor = 'purple';
				showEnableDisplayNoneFields.push(inputs[index]);
				if (!counted) {
					showEnabledCount++;
					counted = true;
				}
			}

			if (inputs[index].style.visibility === 'hidden') {
				inputs[index].style.visibility = '';
				inputs[index].style.borderColor = 'purple';
				showEnableTypeHiddenFields.push(inputs[index]);
				if (!counted) {
					// If any checks are added after this will also need to inc counted
					showEnabledCount++;
				}
			}
		}

		showEnabled = true;
	}

	function showEnableOff() {
		let index;
		for (index = 0; index < showEnableTypeHiddenFields.length; ++index) {
			showEnableTypeHiddenFields[index].type = 'hidden';
			showEnableTypeHiddenFields[index].style.borderColor = '';
		}

		for (index = 0; index < showEnableDisplayNoneFields.length; ++index) {
			showEnableDisplayNoneFields[index].style.display = 'none';
			showEnableDisplayNoneFields[index].style.borderColor = '';
		}

		for (index = 0; index < showEnableDisplayHiddenFields.length; ++index) {
			showEnableDisplayHiddenFields[index].style.visibility = 'hidden';
			showEnableDisplayHiddenFields[index].style.borderColor = '';
		}

		for (index = 0; index < showEnabledDisabled.length; ++index) {
			showEnabledDisabled[index].disabled = true;
			showEnabledDisabled[index].style.borderColor = '';
		}

		for (index = 0; index < showEnabledReadOnly.length; ++index) {
			showEnabledReadOnly[index].readOnly = true;
			showEnabledReadOnly[index].style.borderColor = '';
		}

		showEnableTypeHiddenFields = [];
		showEnableDisplayNoneFields = [];
		showEnableDisplayHiddenFields = [];
		showEnabledDisabled = [];
		showEnabledReadOnly = [];
		showEnabled = false;
		showEnabledCount = 0;
	}

	function showEnableCount() {
		let count = 0;
		if (showEnabled) {
			count = showEnabledCount;
		} else {
			// Count the number of hidden fields
			const inputs = document.querySelectorAll('input');
			for (let index = 0; index < inputs.length; ++index) {
				if (inputs[index].type === 'hidden') {
					count++;
				} else if (inputs[index].style.display === 'none') {
					count++;
				} else if (inputs[index].style.visibility === 'hidden') {
					count++;
				}
			}
		}

		// Send to the management frame with the shared secret
		const iframe = document.getElementById(MANAGEMENT);
		iframe.contentWindow.postMessage({action: 'showEnable.count', tabId, count, sharedSecret: ZAP_SHARED_SECRET}, ZAP_HUD_FILES);
	}

	function highlightAlert(alert) {
		const id = alert.param;
		let el = document.getElementById(id);
		if (!el) {
			const els = document.getElementsByName(id);
			for (let i = 0; i < els.length; i++) {
				if (els[i] instanceof HTMLInputElement) {
					el = els[i];
					break;
				}
			}
		}

		if (el) {
			const colours = {
				Informational: 'blue',
				Low: 'yellow',
				Medium: 'orange',
				High: 'red'
			};
			const colour = colours[alert.risk];
			el.style.borderColor = colour || 'red';
			el.insertAdjacentHTML('afterend',
				'<img src="' + ZAP_HUD_FILES + '/image/flag-' + colour + '.png" ' +
				'id="zapHudAlert-' + alert.id + '" ' +
				'title="' + alert.name + '" height="16" width="16" ' +
				'onclick="injection.showZapAlert(' + alert.id + ');" />');
		}
	}

	function showZapAlertInternal(alertId) {
		// Send to the management frame with the shared secret
		const iframe = document.getElementById(MANAGEMENT);
		iframe.contentWindow.postMessage({action: 'commonAlerts.showAlert', alertId, tabId, sharedSecret: ZAP_SHARED_SECRET}, ZAP_HUD_FILES);
	}

	/* COMMUNICATIONS */
	function receiveMessages(event) {
		if (!isFromTrustedOrigin(event)) {
			return;
		}

		const message = event.data;

		switch (message.action) {
			case 'showPanel':
				showPanel(message.orientation);
				break;

			case 'showHudPanels':
				showHudPanels();
				break;

			case 'hideHudPanels':
				hideHudPanels();
				break;

			case 'showMainDisplay':
				showMainDisplay();
				event.ports[0].postMessage({isDisplayShown: 'true'});
				break;

			case 'hideMainDisplay':
				hideMainDisplay();
				break;

			case 'showBottomDrawer':
				showBottomDrawer();
				break;

			case 'hideBottomDrawer':
				hideBottomDrawer();
				break;

			case 'hideAllDisplayFrames':
				hideAllDisplayFrames();
				break;

			case 'showAllDisplayFrames':
				showAllDisplayFrames();
				break;

			case 'expandPanel':
				expandPanel(message.orientation);
				break;

			case 'contractPanel':
				contractPanel(message.orientation);
				break;

			case 'expandManagement':
				expandManagement();
				break;

			case 'contractManagement':
				contractManagement();
				break;

			case 'refresh':
				window.location.reload(false);
				break;

			case 'refreshAllFrames':
				refreshAllFrames();
				break;

			case 'refreshDisplayFrames':
				refreshDisplayFrames();
				break;

			case 'refreshManagementFrame':
				refreshManagementFrame();
				break;

			case 'heighten':
				heighten(message.orientation);
				break;

			case 'shorten':
				shorten(message.orientation);
				break;

			case 'heightenGrowlerFrame':
				heightenGrowlerFrame(message.lines);
				break;

			case 'shortenGrowlerFrame':
				shortenGrowlerFrame(message.lines);
				break;

			case 'showEnable.on':
				showEnableOn();
				break;

			case 'showEnable.off':
				showEnableOff();
				break;

			case 'showEnable.count':
				showEnableCount();
				break;

			case 'commonAlerts.alert':
				highlightAlert(message);
				break;

			default:
				break;
		}
	}

	/* Initializes the HUD Frames */
	if (window.top === window.self) {
		tabId = generateTabId();

		window.addEventListener('message', receiveMessages);

		const template = document.createElement('template');
		template.innerHTML =
			'<iframe id="' + MANAGEMENT + '" src="' + ZAP_HUD_FILES + '/file/management.html?frameId=management&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; right: 0px; bottom: 50px; width:28px; height:60px; border: medium none; overflow: hidden; z-index: 2147483647"></iframe>\n' +
			'<iframe id="' + LEFT_PANEL + '" src="' + ZAP_HUD_FILES + '/file/panel.html?url=' + URL + '&amp;orientation=left&amp;frameId=leftPanel&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; border: medium none; top: 30%; border: medium none; left: 0px; width: 110px; height: 300px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="' + RIGHT_PANEL + '" src="' + ZAP_HUD_FILES + '/file/panel.html?url=' + URL + '&amp;orientation=right&amp;frameId=rightPanel&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; border: medium none; top: 30%; overflow: hidden; right: 0px; width: 110px; height: 300px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="' + BOTTOM_DRAWER + '" src="' + ZAP_HUD_FILES + '/file/drawer.html?frameId=drawer&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; border: medium none; overflow: hidden; left: 0px; bottom: 0px; width: 100%; height: 50px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="' + MAIN_DISPLAY + '" src="' + ZAP_HUD_FILES + '/file/display.html?frameId=display&amp;tabId=' + tabId + '" style="position: fixed; right: 0px; top: 0px; width: 100%; height: 100%; border: 0px none; display: none; z-index: 2147483647;"></iframe>\n' +
			'<iframe id="' + GROWLER_ALERTS + '" src="' + ZAP_HUD_FILES + '/file/growlerAlerts.html?frameId=growlerAlerts&amp;tabId=' + tabId + '" style="position: fixed; right: 0px; bottom: 30px; width: 500px; height: 0px;border: 0px none; z-index: 2147483647;"></iframe>';
		document.body.append(template.content);
		document.body.style.marginBottom = '50px';

		const zapReplaceOffset = window.location.href.indexOf('zapHudReplaceReq=');
		if (zapReplaceOffset > 0) {
			// Hide the zapHudReplaceReq injected when resending a message in the browser
			// But dont loose any fragment
			const fragment = window.location.hash.substr(1);
			let origUrl = window.location.href.substring(0, zapReplaceOffset - 1);
			if (fragment) {
				origUrl += '#' + fragment;
			}

			history.pushState({}, document.title, origUrl);
		}
	}

	return {
		showZapAlert(alertId) {
			showZapAlertInternal(alertId);
		}
	};
})();
