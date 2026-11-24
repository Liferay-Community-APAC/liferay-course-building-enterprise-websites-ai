"""Level 10.1 / 10.3: the Article and Announcement structures go through Single Approver, reviewed by Content Manager.

Liferay's Single Approver is not edited. Its review task does not list the regular role
"Content Manager", so a copy named "Clarity Article Approval" is deployed with Content Manager
added to the review roles (everything else unchanged). It is deployed again only when its
content differs (every deploy adds a version).

Then the copy is linked, in the Marketing Space only, to each structure of STRUCTURES with a
group-scoped workflow definition link (manage-object-logic, "Workflow on CMS Structures").

Usage: python3 -I scripts/setup_article_workflow.py
"""

import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from liferay_client import Liferay

W = "/o/headless-admin-workflow/v1.0"
NAME = "Clarity Article Approval"
REVIEW_ROLE = {"role-type": "regular", "name": "Content Manager"}
SPACE = "space-marketing"
STRUCTURES = ["Article", "Announcement"]


def child(node, tag):
	return [c for c in node.get("#child-nodes", []) if c.get("#tag-name") == tag]


def value(node, tag):
	found = child(node, tag)

	return found[0].get("#value") if found else None


def review_roles(definition):
	task = [t for t in child(definition, "task") if value(t, "name") == "review"][0]

	return child(child(child(task, "assignments")[0], "roles")[0], "role")


def role_names(definition):
	return [(value(r, "role-type"), value(r, "name")) for r in review_roles(definition)]


def build(single_approver):
	definition = copy.deepcopy(single_approver)

	for node in child(definition, "name"):
		node["#value"] = NAME

	for node in child(definition, "description"):
		node["#value"] = "Single Approver, with Clarity's Content Manager role among the reviewers."

	roles = review_roles(definition)

	if (REVIEW_ROLE["role-type"], REVIEW_ROLE["name"]) not in role_names(definition):
		roles_node = [t for t in child(definition, "task") if value(t, "name") == "review"][0]
		roles_node = child(child(roles_node, "assignments")[0], "roles")[0]
		roles_node["#child-nodes"].append({"#tag-name": "role", "#child-nodes": [
			{"#tag-name": "role-type", "#value": REVIEW_ROLE["role-type"]},
			{"#tag-name": "name", "#value": REVIEW_ROLE["name"]},
		]})

	return definition


def comparable(definition):
	definition = copy.deepcopy(definition)
	definition["#child-nodes"] = [c for c in definition["#child-nodes"] if c.get("#tag-name") != "version"]

	return definition


def main():
	lr = Liferay()
	definitions = {d["name"]: d for d in lr.items(f"{W}/workflow-definitions")}
	single_approver = json.loads(definitions["Single Approver"]["content"])
	print(f"Single Approver review roles: {role_names(single_approver)}")

	if ("regular", "Content Manager") in role_names(single_approver):
		target = definitions["Single Approver"]
		print("Content Manager is already a reviewer: using Single Approver as it is")
	else:
		wanted = build(single_approver)
		current = definitions.get(NAME)

		if current and comparable(json.loads(current["content"])) == comparable(wanted):
			target = current
			print(f"{NAME} is up to date (version {current['version']})")
		else:
			target = lr.post(f"{W}/workflow-definitions/deploy", {
				"active": True,
				"content": json.dumps(wanted),
				"name": NAME,
				"title": NAME,
				"title_i18n": {"en_US": NAME},
			})
			print(f"{NAME} deployed (id {target['id']}, version {target['version']})")

		print(f"{NAME} review roles: {role_names(json.loads(lr.get(f'{W}/workflow-definitions/{target['id']}')['content']))}")

	for name in STRUCTURES:
		definition = [d for d in lr.items(f"/o/object-admin/v1.0/object-definitions?filter=name%20eq%20%27{name}%27")][0]
		lr.put(
			f"{W}/workflow-definition-links/by-external-reference-code/workflow-link-{SPACE}-{name.lower()}",
			{
				"className": definition["className"],
				"groupExternalReferenceCode": SPACE,
				"workflowDefinitionName": target["name"],
				"workflowDefinitionVersion": int(target["version"]),
			})

	# Read back: every link in the Marketing Space.
	print(f"Workflow links in {SPACE}:")
	class_names = {d["className"]: d["name"] for d in lr.items("/o/object-admin/v1.0/object-definitions")}

	for d in lr.items(f"{W}/workflow-definitions"):
		erc = d.get("externalReferenceCode")

		if not erc:
			continue

		for link in lr.items(f"{W}/workflow-definitions/by-external-reference-code/{erc}/workflow-definition-links"):
			if link.get("groupExternalReferenceCode") == SPACE:
				print(
					f"  {class_names.get(link['className'], link['className'])}: {link['workflowDefinitionName']}"
					f" v{link.get('workflowDefinitionVersion')} (link {link.get('externalReferenceCode')})")


if __name__ == "__main__":
	sys.exit(main())
