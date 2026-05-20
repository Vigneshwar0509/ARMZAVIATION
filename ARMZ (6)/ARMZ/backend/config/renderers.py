from config.response import build_response_payload
from rest_framework.renderers import JSONRenderer


STANDARD_RESPONSE_KEYS = {"success", "message", "data", "errors"}


class StandardizedJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        if response is None or response.status_code == 204 or isinstance(data, (str, bytes)):
            return super().render(data, accepted_media_type, renderer_context)

        success = 200 <= response.status_code < 400 and not getattr(response, "exception", False)
        payload = self._coerce_envelope(data=data, success=success)
        return super().render(payload, accepted_media_type, renderer_context)

    def _coerce_envelope(self, data, success):
        if isinstance(data, dict) and STANDARD_RESPONSE_KEYS.issubset(data.keys()):
            return build_response_payload(
                success=bool(data.get("success", success)),
                message=data.get("message") or ("Success" if success else "Request failed"),
                data=data.get("data"),
                errors=data.get("errors"),
            )

        if success:
            if isinstance(data, dict):
                message = data.get("message") if isinstance(data.get("message"), str) else "Success"
                if "data" in data and set(data.keys()).issubset({"message", "data"}):
                    payload_data = data.get("data")
                elif set(data.keys()) == {"message"}:
                    payload_data = None
                else:
                    payload_data = {key: value for key, value in data.items() if key != "message"} or None
                return build_response_payload(True, message, payload_data, None)

            return build_response_payload(True, "Success", data, None)

        if isinstance(data, dict):
            message = data.get("message") if isinstance(data.get("message"), str) else "Request failed"
            error_payload = data.get("errors")
            if error_payload is None:
                error_payload = {key: value for key, value in data.items() if key != "message"} or data
            return build_response_payload(False, message, None, error_payload)

        return build_response_payload(False, "Request failed", None, data)
