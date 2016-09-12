var assign = require('object-assign');
var delegate = require('dom-utils/lib/delegate');
var provide = require('../provide');
var usage = require('../usage');
var createFieldsObj = require('../utilities').createFieldsObj;
var getAttributeFields = require('../utilities').getAttributeFields;

/**
 * Registers outbound link tracking on a tracker object.
 * @constructor
 * @param {Object} tracker Passed internally by analytics.js
 * @param {?Object} opts Passed by the require command.
 */
function DownloadLinkTracker(tracker, opts) {

	usage.track(tracker, usage.plugins.DOWNLOAD_LINK_TRACKER);

	// Feature detects to prevent errors in unsupporting browsers.
	if (!window.addEventListener) return;

	this.opts = assign({
		events: ['click'],
		linkSelector: 'a[download]',
		fieldsObj: {},
		attributePrefix: 'ga-',
		hitFilter: null
	}, opts);

	this.tracker = tracker;

	// Binds methods.
	this.handleLinkInteractions = this.handleLinkInteractions.bind(this);

	// Creates a mapping of events to their delegates
	this.delegates = {};
	this.opts.events.forEach(function(event) {
		this.delegates[event] = delegate(document, event, this.opts.linkSelector,
			this.handleLinkInteractions, { deep: true, useCapture: true });
	}.bind(this));
}

/**
 * Handles all interactions on link elements. A link is considered an outbound
 * link if its hostname property does not match location.hostname. When the
 * beacon transport method is not available, the links target is set to
 * "_blank" to ensure the hit can be sent.
 * @param {Event} event The DOM click event.
 * @param {Element} link The delegated event target.
 */
DownloadLinkTracker.prototype.handleLinkInteractions = function(event, link) {
	var defaultFields = {
		transport: 'beacon',
		eventCategory: 'Download Link',
		eventAction: event.type,
		eventLabel: link.dataset.download
	};

	var userFields = assign({}, this.opts.fieldsObj,
		getAttributeFields(link, this.opts.attributePrefix));

	this.tracker.send('event', createFieldsObj(
		defaultFields, userFields, this.tracker, this.opts.hitFilter, link));

};

/**
 * Removes all event listeners and instance properties.
 */
DownloadLinkTracker.prototype.remove = function() {
	Object.keys(this.delegates).forEach(function(key) {
		this.delegates[key].destroy();
	}.bind(this));
};

provide('downloadLinkTracker', DownloadLinkTracker);