"""Minimal Liferay REST client shared by the Clarity scripts (stdlib only).

- Workspace root: the parent of this scripts/ folder.
- Admin credentials: configs/local/admin.properties (ADMIN_EMAIL / ADMIN_PASSWORD),
  falling back to LIFERAY_ADMIN_EMAIL / LIFERAY_ADMIN_PASSWORD. Never printed.
- Port: LIFERAY_PORT, else the HTTP/1.1 Connector in bundles/tomcat*/conf/server.xml (Tomcat bundle),
  else 8080 (the clarity-liferay Docker container).
- Signs in once through /c/portal/login and reuses the session (much faster than Basic auth
  on every call), sending the CSRF token as x-csrf-token.
"""

import base64
import glob
import http.cookiejar
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_admin_credentials():
	path = os.path.join(ROOT, "configs", "local", "admin.properties")
	props = {}

	if os.path.exists(path):
		with open(path, encoding="utf8") as f:
			for line in f:
				line = line.strip()

				if line and not line.startswith("#") and "=" in line:
					key, value = line.split("=", 1)
					props[key.strip()] = value.strip()

	email = props.get("ADMIN_EMAIL") or os.environ.get("LIFERAY_ADMIN_EMAIL")
	password = props.get("ADMIN_PASSWORD") or os.environ.get("LIFERAY_ADMIN_PASSWORD")

	if not email or not password:
		raise SystemExit("No admin credentials in configs/local/admin.properties or LIFERAY_ADMIN_*")

	return email, password


def read_port():
	if os.environ.get("LIFERAY_PORT"):
		return int(os.environ["LIFERAY_PORT"])

	for path in sorted(glob.glob(os.path.join(ROOT, "bundles", "tomcat*", "conf", "server.xml"))):
		with open(path, encoding="utf8") as f:
			xml = re.sub(r"<!--.*?-->", "", f.read(), flags=re.S)

		for connector in re.findall(r"<Connector\b[^>]*>", xml, flags=re.S):
			if 'protocol="HTTP/1.1"' in connector:
				match = re.search(r'\bport="(\d+)"', connector)

				if match:
					return int(match.group(1))

	return 8080


class ApiError(Exception):

	def __init__(self, status, method, url, body):
		super().__init__(f"{method} {url} -> {status}: {body[:500]}")
		self.status = status
		self.body = body


class Liferay:

	def __init__(self, email=None, password=None, base_url=None, sign_in=True):
		if email is None:
			email, password = read_admin_credentials()

		self.base_url = base_url or f"http://localhost:{read_port()}"
		self._email = email
		self._password = password
		self._jar = http.cookiejar.CookieJar()
		self._opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self._jar))
		self._token = None

		if sign_in:
			self._sign_in()

	def _raw(self, method, url, data=None, headers=None):
		request = urllib.request.Request(url, data=data, headers=headers or {}, method=method)

		try:
			with self._opener.open(request, timeout=300) as response:
				return response.status, response.read().decode("utf8", "replace")
		except urllib.error.HTTPError as e:
			return e.code, e.read().decode("utf8", "replace")

	def _auth_token(self):
		status, html = self._raw("GET", self.base_url + "/web/guest/home")

		if status >= 400:
			status, html = self._raw("GET", self.base_url + "/")

		match = re.search(r"authToken\s*[:=]\s*['\"]([^'\"]+)['\"]", html) or re.search(
			r"p_auth=([A-Za-z0-9]+)", html)

		return match.group(1) if match else None

	def _sign_in(self):
		token = self._auth_token()
		form = urllib.parse.urlencode(
			{"login": self._email, "password": self._password, "p_auth": token or ""}).encode()
		self._raw(
			"POST", self.base_url + "/c/portal/login", form,
			{"Content-Type": "application/x-www-form-urlencoded"})
		self._token = self._auth_token()
		status, body = self.request("GET", "/o/headless-admin-user/v1.0/my-user-account", raise_errors=False)

		if status != 200:
			# Fall back to Basic auth when the session sign-in did not take.
			self._token = None
			self._basic = base64.b64encode(f"{self._email}:{self._password}".encode()).decode()
		else:
			self._basic = None

	def request(self, method, path, body=None, raise_errors=True, headers=None, raw_body=None):
		url = path if path.startswith("http") else self.base_url + path
		hdrs = {"Accept": "application/json"}

		if headers:
			hdrs.update(headers)

		data = raw_body

		if body is not None:
			data = json.dumps(body).encode("utf8")
			hdrs["Content-Type"] = "application/json"

		if self._token:
			hdrs["x-csrf-token"] = self._token

		if getattr(self, "_basic", None):
			hdrs["Authorization"] = "Basic " + self._basic

		status, text = self._raw(method, url, data, hdrs)

		try:
			parsed = json.loads(text) if text else None
		except ValueError:
			parsed = text

		if raise_errors and status >= 400:
			raise ApiError(status, method, url, text)

		return status, parsed

	def get(self, path, **kw):
		return self.request("GET", path, **kw)[1]

	def post(self, path, body=None, **kw):
		return self.request("POST", path, body, **kw)[1]

	def put(self, path, body=None, **kw):
		return self.request("PUT", path, body, **kw)[1]

	def patch(self, path, body=None, **kw):
		return self.request("PATCH", path, body, **kw)[1]

	def delete(self, path, **kw):
		return self.request("DELETE", path, **kw)[1]

	def items(self, path, page_size=200):
		sep = "&" if "?" in path else "?"
		page = 1

		while True:
			data = self.get(f"{path}{sep}page={page}&pageSize={page_size}")

			for item in data.get("items", []):
				yield item

			if page >= data.get("lastPage", 1):
				break

			page += 1


def q(value):
	return urllib.parse.quote(str(value), safe="")


def has_blueprints(lr, attempts=6):
	"""Whether this instance has Search Blueprints (Liferay Enterprise Search).

	The DXP Free Tier key doesn't include them, and their API answers 404. Right after a start the
	API also answers 404 for about 20 seconds, so a 404 is retried a few times before it counts.
	"""

	import time

	for attempt in range(attempts):
		status, _body = lr.request(
			"GET", "/o/search-experiences-rest/v1.0/sxp-elements?pageSize=1", raise_errors=False)

		if status != 404:
			return True

		if attempt < attempts - 1:
			time.sleep(5)

	return False
