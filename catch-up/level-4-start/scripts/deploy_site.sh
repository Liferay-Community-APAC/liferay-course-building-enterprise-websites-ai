#!/usr/bin/env bash
#
# Deploy client-extensions/clarity-site, wait for the site initializer to finish,
# check that every master page of the tree exists (deploying once more if not), then
# re-apply the Level 2.3 site settings that every deploy resets (languages; membership
# stays Open through site-configuration.json) with scripts/site_settings.py.
# Run from the workspace root: bash scripts/deploy_site.sh
#
set -o errexit -o nounset -o pipefail

cd "$(dirname "$0")/.."

SITE="Clarity Public Enterprise Website"
LOG="bundles/logs/liferay.$(date -u +%Y-%m-%d).log"

count() {
	local n
	n=$(grep --count "Initialized ${SITE}" "${LOG}" 2>/dev/null || true)
	echo "${n:-0}"
}

before=$(count)
start_line=$(wc -l < "${LOG}" 2>/dev/null || echo 0)

rm -f bundles/osgi/client-extensions/clarity-site.zip
(cd client-extensions/clarity-site && blade gw clean deploy)

now=${before}

for _ in $(seq 1 100); do
	now=$(count)
	[[ ${now} -gt ${before} ]] && break
	sleep 3
done

if [[ ${now} -le ${before} ]]; then
	echo "The site initializer didn't report Initialized within 5 minutes: check ${LOG}" >&2
	tail -n +$((start_line + 1)) "${LOG}" | grep -E "ERROR|Exception" | cut -c1-400 | head -20 >&2 || true
	exit 1
fi

echo "Site initializer ran:"
tail -n +$((start_line + 1)) "${LOG}" | grep -E "Initialized ${SITE}|WARN|ERROR" | cut -c1-300 | head -20 || true

# On a new instance, the first run can skip a master page that shows a collection: the
# initializer's handlers run in no fixed order, and when master pages come before the
# collections, the Primary Master Page (its announcement bar) is skipped without an error.
# Deploy once more if a master page of the tree is missing on the site.
missing=$(python3 -I - <<'PY'
import glob, json, os, sys, time
sys.path.insert(0, "scripts")
from liferay_client import Liferay
tree = "client-extensions/clarity-site/site-initializer/layout-page-templates/master-pages"
wanted = {json.load(open(p))["name"] for p in glob.glob(os.path.join(tree, "*", "master-page.json"))}
lr = Liferay()

# The Initialized line comes before the run's transaction commits: give it half a minute.
for _ in range(10):
	have = {m["name"] for m in lr.items("/o/headless-admin-site/v1.0/sites/clarity-public/master-pages")}

	if wanted <= have:
		break

	time.sleep(3)

print(", ".join(sorted(wanted - have)))
PY
)

if [[ -n "${missing}" ]]; then
	if [[ "${CLARITY_DEPLOY_RETRY:-}" == "1" ]]; then
		echo "Master pages still missing after a second deploy: ${missing}. Check ${LOG}" >&2
		exit 1
	fi

	echo "Master pages missing after this run: ${missing}. Deploying once more..."
	CLARITY_DEPLOY_RETRY=1 exec bash "$0"
fi

echo "Re-applying the site settings..."
python3 -I scripts/site_settings.py
