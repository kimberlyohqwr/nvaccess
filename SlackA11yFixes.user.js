﻿// ==UserScript==
// @name           Slack Accessibility Fixes
// @namespace      http://axSgrease.nvaccess.org/
// @description    Improves the accessibility of Slack.
// @author         James Teh <jamie@nvaccess.org>
// @copyright 2017 NV Access Limited
// @license GNU General Public License version 2.0
// @version        2017.1
// @grant GM_log
// @include https://*.slack.com/*
// ==/UserScript==

function initial() {
	var elem;
	// In DOM order, the footer is earlier than the messages.
	// Put it below for a11y (as it appears visually).
	if (elem = document.querySelector("#col_messages"))
		elem.setAttribute("aria-owns", "messages_container footer");
	// Same for the unread messages status, which appears below in DOM order but earlier visually.
	if (elem = document.querySelector("#messages_container"))
		elem.setAttribute("aria-owns", "messages_unread_status monkey_scroll_wrapper_for_msgs_scroller_div");
	// Make close link for about channel pane accessible.
	for (elem of document.querySelectorAll(".close_flexpane")) {
		elem.setAttribute("role", "button");
		// The content is a private use Unicode character. Use the title as the name.
		elem.setAttribute("aria-label", elem.getAttribute("title"));
	}
}

// Make the starred status accessible.
function setStarred(elem) {
	elem.setAttribute("aria-pressed",
		elem.classList.contains("starred") ? "true" : "false");
}

function onNodeAdded(target) {
	if (target.matches(".offscreen[contenteditable]")) {
		// Hidden contentEditable near the bottom which doesn't seem to be relevant to the user.
		target.setAttribute("role", "presentation");
		return;
	}
	var elem;
	for (elem of target.querySelectorAll(".copy_only")) {
		// This includes text such as the brackets around message times.
		// These chunks of text are block elements, even though they're on the same line.
		// Remove the elements from the tree so the text becomes inline.
		elem.setAttribute("role", "presentation");
	}
	// Channel/message star controls.
	for (elem of target.querySelectorAll(".star")) {
		elem.setAttribute("aria-label", "star");
		setStarred(elem);
	}
	// Make headings for day separators in message history, about channel pane heading.
	for (elem of target.querySelectorAll(".day_divider,.heading")) {
		elem.setAttribute("role", "heading");
		elem.setAttribute("aria-level", "2");
	}
}

function onClassModified(target) {
	var classes = target.classList;
	if (!classes)
		return;
	if (classes.contains("star")) {
		// Starred state changed.
		setStarred(target);
	}
}

var observer = new MutationObserver(function(mutations) {
	for (var mutation of mutations) {
		try {
			if (mutation.type === "childList") {
				for (var node of mutation.addedNodes) {
					if (node.nodeType != Node.ELEMENT_NODE)
						continue;
					onNodeAdded(node);
				}
			} else if (mutation.type === "attributes") {
				if (mutation.attributeName == "class")
					onClassModified(mutation.target);
			}
		} catch (e) {
			// Catch exceptions for individual mutations so other mutations are still handled.
			GM_log("Exception while handling mutation: " + e);
		}
	}
});
observer.observe(document, {childList: true, attributes: true,
	subtree: true, attributeFilter: ["class"]});

initial();
