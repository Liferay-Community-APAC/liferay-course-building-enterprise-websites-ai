#!/usr/bin/env bash
#
# Deploy client-extensions/clarity-site, wait for the site initializer to finish,
# then re-apply the site settings that every deploy resets (languages, membership).
# Run from the workspace root: bash scripts/deploy_site.sh
#
set -o errexit -o nounset -o pipefail

LOG="bundles/logs/liferay.$(date -u +%Y-%m-%d).log"
before=$(grep --count "Initialized Clarity Public Enterprise Website" "${LOG}" 2>/dev/null || true)
before=${before:-0}

rm -f bundles/osgi/client-extensions/clarity-site.zip
(cd client-extensions/clarity-site && blade gw clean deploy)

for _ in $(seq 1 100); do
	now=$(grep --count "Initialized Clarity Public Enterprise Website" "${LOG}" 2>/dev/null || true)
	[[ ${now:-0} -gt ${before} ]] && break
	sleep 3
done

if [[ ${now:-0} -le ${before} ]]; then
	echo "The site initializer didn't report Initialized within 5 minutes: check ${LOG}" >&2
	exit 1
fi

echo "Site initializer ran. Re-applying site settings..."
python3 -I scripts/setup_sites.py
