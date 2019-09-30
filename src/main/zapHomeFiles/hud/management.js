/*
 * Management Frame
 *
 * Initializes the service worker and forwards messages between the service worker
 * and inject.js.
 */

// temp time test
const startTime = new Date().getTime();

// Injected strings
const SHOW_WELCOME_SCREEN = '<<SHOW_WELCOME_SCREEN>>' === 'true';
const TUTORIAL_URL = '<<TUTORIAL_URL>>';
const ZAP_SHARED_SECRET = '<<ZAP_SHARED_SECRET>>';

let app;
let tabId = '';
let frameId = '';
const context = {
	url: document.referrer,
	domain: utils.parseDomainFromUrl(document.referrer)
};

Vue.component('welcome-screen', {
	template: '#welcome-screen-template',
	props: [],
	methods: {
		continueToTutorial() {
			showTutorial();
			this.closeWelcomeScreen();
		},
		closeWelcomeScreen() {
			if (dontShowAgain.checked) {
				navigator.serviceWorker.controller.postMessage({
					action: 'zapApiCall', component: 'hud', type: 'action',
					name: 'setOptionShowWelcomeScreen',
					params: {Boolean: 'false'}});
			}

			app.showWelcomeScreen = false;
			parent.postMessage({action: 'contractManagement'}, document.referrer);
		}
	},
	data() {
		return {
			dontShowAgain: false
		};
	}
});

function showTutorial() {
	window.open(TUTORIAL_URL);
}

document.addEventListener('DOMContentLoaded', () => {
	const params = new URL(document.location).searchParams;

	frameId = params.get('frameId');
	tabId = params.get('tabId');

	app = new Vue({
		el: '#app',
		data: {
			showWelcomeScreen: false
		}
	});

	// If first time starting HUD boot up the service worker
	if (navigator.serviceWorker.controller === null) {
		// Temp time test
		localforage.setItem('starttime', startTime);

		parent.postMessage({action: 'hideAllDisplayFrames'}, document.referrer);

		localforage.setItem('is_first_load', true);

		startServiceWorker();
	} else {
		parent.postMessage({action: 'showAllDisplayFrames'}, document.referrer);

		// Temp time test
		localforage.getItem('starttime')
			.then(startT => {
				const currentTime = new Date().getTime();
				const diff = currentTime - parseInt(startT, 10);
				console.log('Time (ms) to load UI: ' + diff);
			});

		localforage.setItem(IS_SERVICEWORKER_REFRESHED, true);
		localforage.getItem('is_first_load')
			.then(isFirstLoad => {
				localforage.setItem('is_first_load', false);

				if (isFirstLoad && SHOW_WELCOME_SCREEN) {
					parent.postMessage({action: 'expandManagement'}, document.referrer);
					app.showWelcomeScreen = true;
				}
			});

		window.addEventListener('message', windowMessageListener);
		navigator.serviceWorker.addEventListener('message', serviceWorkerMessageListener);
		navigator.serviceWorker.controller.postMessage({action: 'targetload', tabId, targetUrl: context.url});

		startHeartBeat();
	}
});

/*
 * Receive messages from the target domain, which is not trusted.
 * As a result we only accept messages that contain a shared secret generated and injected at runtime.
 * The contents of the messages should still be treated as potentially malicious.
 */
function windowMessageListener(event) {
	const message = event.data;
	if (!Object.prototype.hasOwnProperty.call(message, 'sharedSecret')) {
		utils.log(LOG_WARN, 'management.receiveMessage', 'Message without sharedSecret rejected', message);
	} else if (ZAP_SHARED_SECRET === '') {
		// A blank secret is used to indicate that this functionality is turned off
		utils.log(LOG_DEBUG, 'management.receiveMessage', 'Message from target domain ignored as on-domain messaging has been switched off');
	} else if (message.sharedSecret === ZAP_SHARED_SECRET) {
		// These are the only messages we allow from the target site, validate and filter out just the info we are expecting
		const limitedData = {};
		limitedData.action = message.action;
		limitedData.tabId = message.tabId;
		switch (message.action) {
			case 'showEnable.count':
				if (message.count === parseInt(message.count, 10)) {
					limitedData.count = message.count;
					navigator.serviceWorker.controller.postMessage(limitedData);
					return;
				}

				break;
			case 'commonAlerts.showAlert':
				if (message.alertId === parseInt(message.alertId, 10)) {
					limitedData.alertId = message.alertId;
					navigator.serviceWorker.controller.postMessage(limitedData);
					return;
				}

				break;
			default:
				break;
		}

		utils.log(LOG_DEBUG, 'management.receiveMessage', 'Unrecognised message from target domain ignored', message);
	} else {
		utils.log(LOG_WARN, 'management.receiveMessage', 'Message with incorrect sharedSecret rejected', message);
	}
}

function serviceWorkerMessageListener(event) {
	const message = event.data;

	switch (message.action) {
		case 'refreshTarget':
			parent.postMessage({action: 'refresh'}, document.referrer);
			break;

		case 'showEnable.on':
			parent.postMessage({action: 'showEnable.on'}, document.referrer);
			break;

		case 'showEnable.off':
			parent.postMessage({action: 'showEnable.off'}, document.referrer);
			break;

		case 'showEnable.count':
			parent.postMessage({action: 'showEnable.count'}, document.referrer);
			break;

		case 'commonAlerts.alert':
			parent.postMessage(message, document.referrer);
			break;

		case 'showTutorial':
			showTutorial();
			break;

		default:
			console.log('Unexpected action ' + message.action);
			break;
	}
}

/*
 * Starts the service worker and refreshes the target on success.
 */
function startServiceWorker() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register(utils.getZapFilePath('serviceworker.js'))
			.then(registration => {
				utils.log(LOG_INFO, 'Service worker registration was successful for the scope: ' + registration.scope);

				// Wait until serviceworker is installed and activated
				return navigator.serviceWorker.ready;
			})
			.then(() => {
				// Refresh the frames so the service worker can take control
				parent.postMessage({action: 'refreshAllFrames'}, document.referrer);
			})
			.catch(utils.errorHandler);
	} else {
		console.log('This browser does not support Service Workers. The HUD will not work.');
	}
}

/*
 * Starts sending heart beat messages to the ZAP API every 10 seconds
 */
function startHeartBeat() {
	setInterval(() => {
		navigator.serviceWorker.controller.postMessage({action: 'heartbeat'});
	}, 10000);
}
