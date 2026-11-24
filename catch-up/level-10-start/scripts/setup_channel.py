"""Level 8.3: the "Clarity Public" commerce channel (type site, USD) linked to clarity-public.

The channel is upserted by ERC over headless-commerce-admin-channel. The commerce site type (B2B)
has no REST field (commerce-catalogs): it is set by the clarity-site initializer's
commerce-channel.json + commerce-channel.config.json, which upsert the channel of the site, so this
script writes the same channel fields there. Deploy clarity-site after running it.

Usage: python3 -I scripts/setup_channel.py [--read]
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import ROOT, Liferay

API = "/o/headless-commerce-admin-channel/v1.0"
SITE_ERC = "clarity-public"
CHANNEL = {
	"currencyCode": "USD",
	"externalReferenceCode": "clarity-public-channel",
	"name": "Clarity Public",
	"type": "site",
}
TREE = os.path.join(ROOT, "client-extensions", "clarity-site", "site-initializer")


def main():
	lr = Liferay()
	site = lr.get(f"/o/headless-admin-site/v1.0/sites/{SITE_ERC}")

	if "--read" not in sys.argv:
		lr.put(
			f"{API}/channels/by-externalReferenceCode/{CHANNEL['externalReferenceCode']}",
			dict(CHANNEL, siteGroupId=site["id"]))

		# The initializer adds siteGroupId itself and finds the channel by it.
		with open(os.path.join(TREE, "commerce-channel.json"), "w", encoding="utf8") as f:
			json.dump(CHANNEL, f, indent="\t")
			f.write("\n")

		with open(os.path.join(TREE, "commerce-channel.config.json"), "w", encoding="utf8") as f:
			json.dump({"com.liferay.commerce.account": {"commerceSiteType": "1"}}, f, indent="\t")  # 1 = B2B
			f.write("\n")

	channel = lr.get(f"{API}/channels/by-externalReferenceCode/{CHANNEL['externalReferenceCode']}")
	channels = [c for c in lr.get(f"{API}/channels?pageSize=50")["items"] if c.get("siteGroupId") == site["id"]]
	print(
		f"Channel {channel['name']} (ERC {channel['externalReferenceCode']}, id {channel['id']}): type "
		f"{channel['type']}, currency {channel['currencyCode']}, siteGroupId {channel['siteGroupId']} = "
		f"site {site['name']} ({site['externalReferenceCode']}, {site.get('friendlyUrlPath')}); "
		f"channels on that site: {len(channels)}")


if __name__ == "__main__":
	main()
