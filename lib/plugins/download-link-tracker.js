import {delegate} from 'dom-utils';
import provide from '../provide';
import {plugins, trackUsage} from '../usage';
import {assign, createFieldsObj,
    getAttributeFields} from '../utilities';

/**
 * Class for the `downloaLinkTracker` analytics.js plugin.
 */
class DownloadLinkTracker {

    constructor(tracker, opts) {
        trackUsage(tracker, plugins.DOWNLOAD_LINK_TRACKER);

        // Feature detects to prevent errors in unsupporting browsers.
        if (!window.addEventListener) return;

        this.opts = assign({
            events: ['click'],
            linkSelector: 'a[download]',
            fieldsObj: {},
            attributePrefix: 'ga-',
        }, opts);

        this.tracker = tracker;

        // Binds methods.
        this.handleLinkInteractions = this.handleLinkInteractions.bind(this);

        // Creates a mapping of events to their delegates
        this.delegates = {};
        this.opts.events.forEach((event) => {
            this.delegates[event] = delegate(document, event, this.opts.linkSelector,
                this.handleLinkInteractions, {composed: true, useCapture: true});
        });
    }

    /**
     * Handles all interactions on link elements. A link is considered an outbound
     * link if its hostname property does not match location.hostname. When the
     * beacon transport method is not available, the links target is set to
     * "_blank" to ensure the hit can be sent.
     * @param {Event} event The DOM click event.
     * @param {Element} link The delegated event target.
     */
    handleLinkInteractions(event, link) {
        let defaultFields = {
            transport: 'beacon',
            eventCategory: 'Download Link',
            eventAction: event.type,
            eventLabel: link.dataset.download,
        };

        const userFields = assign({}, this.opts.fieldsObj,
            getAttributeFields(link, this.opts.attributePrefix));

        this.tracker.send('event', createFieldsObj(
            defaultFields, userFields, this.tracker, this.opts.hitFilter, link));
    }

    /**
     * Removes all event listeners and instance properties.
     */
    remove() {
        Object.keys(this.delegates).forEach((key) => {
            this.delegates[key].destroy();
        });
    }

}

provide('downloadLinkTracker', DownloadLinkTracker);
