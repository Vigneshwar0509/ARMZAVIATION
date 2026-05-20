import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "http://localhost:8000"


def request(method, path, headers=None, data=None):
    url = urllib.parse.urljoin(BASE_URL, path)
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
    else:
        payload = None
    req = urllib.request.Request(url, data=payload, method=method)
    req.add_header("Accept", "application/json")
    req.add_header("Content-Type", "application/json")
    if headers:
        for key, value in headers.items():
            req.add_header(key, value)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                payload = body
            return resp.status, payload
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8")
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            payload = body
        return err.code, payload
    except Exception as exc:
        raise RuntimeError(f"Request failed: {exc}") from exc


def assert_status(status, expected, msg):
    if status != expected:
        raise AssertionError(f"{msg}: expected {expected}, got {status}")


def run_smoke_tests():
    print("Running API smoke tests against", BASE_URL)

    status, data = request("GET", "/health")
    assert_status(status, 200, "/health returned status")
    print("PASS /health", data)

    login_payload = {
        "email": "student1@example.com",
        "password": "Password123!",
    }
    status, data = request("POST", "/auth/login", data=login_payload)
    assert_status(status, 200, "/auth/login returned status")
    if not isinstance(data, dict) or "token" not in data:
        raise AssertionError("/auth/login response missing token")
    token = data["token"]
    print("PASS /auth/login token received")

    status, data = request("GET", "/auth/profile", headers={"Authorization": f"Bearer {token}"})
    assert_status(status, 200, "/auth/profile returned status")
    print("PASS /auth/profile", data)

    status, data = request("GET", "/jobs")
    assert_status(status, 200, "/jobs returned status")
    print("PASS /jobs returned", len(data.get("data", data) if isinstance(data, dict) else data))

    status, data = request("GET", "/plans")
    assert_status(status, 200, "/plans returned status")
    print("PASS /plans returned", len(data.get("data", data) if isinstance(data, dict) else data))

    print("All smoke tests passed.")


if __name__ == "__main__":
    try:
        run_smoke_tests()
    except AssertionError as err:
        print("SMOKE TEST FAILED:", err)
        sys.exit(1)
    except Exception as exc:
        print("ERROR:", exc)
        sys.exit(2)
