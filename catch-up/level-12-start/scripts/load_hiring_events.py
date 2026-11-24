"""Level 11.3: the hiring events (context-source/content/hiring-events.json) as Event Information
entries in the Events Space, in a Contents folder "Hiring Events", viewable by Guest.

Dates are relative to the day the script runs ("30 days before today, 10:00"). The structure's
date fields store the input as entered (timeStorage useInputAsEntered). Re-runnable: entries upsert
by ERC, the folder is created only when missing, and grants are merged (GET, then PUT).

Usage: python3 -I scripts/load_hiring_events.py
"""

import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay, q

SPACE = "space-events"
FOLDER_ERC = "folder-events-hiring-events"
REST = "/o/c/eventinformations"
GUEST = {"actionIds": ["VIEW"], "roleExternalReferenceCode": "L_GUEST", "roleName": "Guest"}


def resolve(text, today):
	match = re.fullmatch(r"(\d+) days (before|after) today, (\d{1,2}):(\d{2})", text.strip())

	if not match:
		raise ValueError(f"Unexpected date: {text}")

	days = int(match.group(1)) * (-1 if match.group(2) == "before" else 1)
	day = today + datetime.timedelta(days=days)

	return f"{day.isoformat()}T{int(match.group(3)):02d}:{match.group(4)}:00Z"


def slug(text):
	return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def grant_guest(lr, path):
	items = lr.get(path)["items"]
	rows = [
		{k: row[k] for k in ("actionIds", "roleExternalReferenceCode", "roleName")}
		for row in items if row["roleName"] != "Guest"]
	guest = next((row for row in items if row["roleName"] == "Guest"), None)
	actions = sorted(set((guest or {}).get("actionIds", [])) | {"VIEW"})
	rows.append(dict(GUEST, actionIds=actions))
	lr.put(path, rows)


def main():
	lr = Liferay()
	today = datetime.date.today()

	with open(os.path.join(ROOT, "context-source", "content", "hiring-events.json"), encoding="utf8") as f:
		events = json.load(f)

	status, folder = lr.request(
		"GET", f"/o/headless-object/v1.0/scopes/{SPACE}/object-entry-folder/by-external-reference-code/{FOLDER_ERC}",
		raise_errors=False)

	if status == 404:
		folder = lr.post(f"/o/headless-object/v1.0/scopes/{SPACE}/object-entry-folders", {
			"externalReferenceCode": FOLDER_ERC,
			"parentObjectEntryFolderExternalReferenceCode": "L_CONTENTS",
			"title": "Hiring Events",
		})

	print("folder:", folder["id"], folder["title"])
	grant_guest(lr, f"/o/headless-object/v1.0/object-entry-folders/{folder['id']}/permissions")

	for event in events:
		erc = "hiring-event-" + slug(event["title"])
		body = {
			"externalReferenceCode": erc,
			"location": event["location"],
			"objectEntryFolderExternalReferenceCode": FOLDER_ERC,
			"startDateTime": resolve(event["start"], today),
			"endDateTime": resolve(event["end"], today),
			"subtitleDescription": event["subtitleDescription"],
			"title": event["title"],
		}
		entry = lr.put(f"{REST}/scopes/{SPACE}/by-external-reference-code/{q(erc)}", body)
		grant_guest(lr, f"{REST}/{entry['id']}/permissions")
		print(entry["id"], entry["title"], entry["startDateTime"], entry["status"]["label"])


if __name__ == "__main__":
	main()
