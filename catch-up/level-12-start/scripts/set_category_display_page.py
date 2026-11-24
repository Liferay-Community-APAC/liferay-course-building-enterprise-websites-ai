"""Level 8.5: make Product List the Clarity Public channel's default category display page.

No site-initializer file sets this (commerce-catalogs), so it is a REST step after each
(re)provision: the page is looked up by friendly URL and linked by its uuid.

Usage: python3 -I scripts/set_category_display_page.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay

CHANNEL_ERC = "clarity-public-channel"
SITE_ERC = "clarity-public"
FRIENDLY_URL = "/product-list"
API = f"/o/headless-commerce-admin-channel/v1.0/channels/by-externalReferenceCode/{CHANNEL_ERC}/default-category-display-pages"


def main():
	lr = Liferay()
	pages = lr.get(f"/o/headless-admin-site/v1.0/sites/{SITE_ERC}/site-pages?pageSize=100")["items"]
	[page] = [p for p in pages if (p.get("friendlyUrlPath_i18n") or {}).get("en-US") == FRIENDLY_URL]
	uuid = page.get("uuid")

	if not uuid:
		raise SystemExit(f"no uuid on {FRIENDLY_URL}: {sorted(page)}")

	# The GET answers one object (pageUuid), not a list.
	status, current = lr.request("GET", API, raise_errors=False)

	if status != 200 or (current or {}).get("pageUuid") != uuid:
		lr.post(API, {"pageUuid": uuid})

	print(f"default category display page: {lr.get(API).get('pageUuid')} (Product List uuid {uuid})")


if __name__ == "__main__":
	main()
