"""Level 11.2 and 11.3, the free-key paths: what the workbook does when the DXP activation key has
no Search Blueprints (the DXP Free Tier key doesn't include Liferay Enterprise Search).

On an instance with Search Blueprints it does nothing: setup_job_blueprint.py and
setup_future_events.py build the blueprint paths. Without them, it:

1. Sets each event's expiration date to its start (every Event Information entry of the Events
   Space, Level 6's Clarity Vision Showcase 2027 included), and expires the events that already
   started (Liferay refuses an expiration date in the past, and doesn't expire CMS entries by
   itself when the date passes). Needs load_hiring_events.py first.
2. Rewrites the tree: on Open Positions, the Blueprints Options widget becomes two invisible,
   immutable Custom Filter widgets (Job Listing entries only; "Associate" titles boosted). On
   Events, the Collection Display shows the "Upcoming Events" collection (build_collections.py
   writes it: Event Information, by expiration date ascending) instead of the blueprint.

Re-runnable. Run it before build_collections.py and the deploy.

Usage: python3 -I scripts/free_key_search.py
"""

import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay, has_blueprints, q

EVENTS = "/o/c/eventinformations"
SPACE = "space-events"
LAYOUTS = os.path.join(ROOT, "client-extensions", "clarity-site", "site-initializer", "layouts")
OPEN_POSITIONS = os.path.join(LAYOUTS, "06-careers", "01-open-positions", "page-definition.json")
EVENTS_PAGE = os.path.join(LAYOUTS, "09-events", "page-definition.json")

BLUEPRINT_OPTIONS = "com_liferay_search_experiences_web_internal_blueprint_options_portlet_SXPBlueprintOptionsPortlet"
CUSTOM_FILTER = "com_liferay_portal_search_web_internal_custom_filter_portlet_CustomFilterPortlet"


def custom_filter(config):
	return {"definition": {"widgetInstance": {"widgetConfig": config, "widgetName": CUSTOM_FILTER}}, "type": "Widget"}


CUSTOM_FILTERS = [
	custom_filter({
		"customHeading": "Job Listings Only",
		"filterField": "objectDefinitionExternalReferenceCode",
		"filterQueryType": "term",
		"filterValue": "job_listing_structure",
		"immutable": "true",
		"invisible": "true",
		"occur": "filter",
	}),
	custom_filter({
		"boost": "100",
		"customHeading": "Associate First",
		"filterField": "localized_title_en_US",
		"filterQueryType": "match",
		"filterValue": "Associate",
		"immutable": "true",
		"invisible": "true",
		"occur": "should",
	}),
]


def expire_past_events(lr):
	now = datetime.datetime.now(datetime.timezone.utc)
	# Every Event Information entry of the Events Space: the hiring events, and Level 6's
	# Clarity Vision Showcase 2027, so the collection's sort by expiration date covers them all.
	events = list(lr.items(f"{EVENTS}/scopes/{SPACE}"))

	if not any(e["externalReferenceCode"].startswith("hiring-event-") for e in events):
		raise SystemExit("No hiring events in the Events Space: run scripts/load_hiring_events.py first.")

	for event in events:
		start = datetime.datetime.fromisoformat(event["startDateTime"][:19]).replace(tzinfo=datetime.timezone.utc)
		erc = event["externalReferenceCode"]

		if start > now:
			expiration = start.strftime("%Y-%m-%dT%H:%M:%SZ")

			lr.request("PATCH", f"{EVENTS}/{event['id']}", {"expirationDate": expiration})
			print(f"  {event['title']}: expires {expiration}")
		elif event["status"]["label"] != "expired":
			lr.request("POST", f"{EVENTS}/scopes/{SPACE}/by-external-reference-code/{q(erc)}/expire")
			print(f"  {event['title']}: started {start:%Y-%m-%d}, expired now")
		else:
			print(f"  {event['title']}: already expired")


def swap_widget(element):
	children = element.get("pageElements", [])

	for index, child in enumerate(children):
		widget = child.get("definition", {}).get("widgetInstance", {}).get("widgetName", "")

		if widget == BLUEPRINT_OPTIONS:
			children[index:index + 1] = CUSTOM_FILTERS

			return True

		if swap_widget(child):
			return True

	return False


def rewrite(path, change):
	with open(path, encoding="utf8") as f:
		text = f.read()

	new = change(text)

	if new != text:
		with open(path, "w", encoding="utf8") as f:
			f.write(new)

	return new != text


def open_positions(text):
	if CUSTOM_FILTER in text:
		return text

	definition = json.loads(text)

	if not swap_widget(definition["pageElement"]):
		raise SystemExit(f"No Blueprints Options widget found in {OPEN_POSITIONS}")

	return json.dumps(definition, indent="\t", ensure_ascii=False) + "\n"


def events_page(text):
	return re.sub(
		r'"className": "com\.liferay\.search\.experiences\.model\.SXPBlueprint_\[\$COMPANY_ID\$\]_FUTURE_EVENTS"(\s*)\}(\s*),(\s*)"collectionType": "CollectionProvider"',
		r'"className": "com.liferay.asset.list.model.AssetListEntry",\1"classPK": "[#ASSET_LIST_ENTRY_ID:UPCOMING-EVENTS#]"\1}\2,\3"collectionType": "Collection"',
		text)


def main():
	lr = Liferay()

	if has_blueprints(lr):
		print("This instance has Search Blueprints: nothing to do (the blueprint paths of 11.2 and 11.3 apply).")

		return

	print("No Search Blueprints (DXP Free Tier key): setting up the free-key paths of 11.2 and 11.3.")
	print("Events:")
	expire_past_events(lr)

	print("Open Positions: Custom Filter widgets", "added" if rewrite(OPEN_POSITIONS, open_positions) else "already there")
	print("Events: Upcoming Events collection", "bound" if rewrite(EVENTS_PAGE, events_page) else "already bound")

	with open(EVENTS_PAGE, encoding="utf8") as f:
		if "UPCOMING-EVENTS" not in f.read():
			raise SystemExit(f"Couldn't bind the Upcoming Events collection in {EVENTS_PAGE}")


if __name__ == "__main__":
	main()
