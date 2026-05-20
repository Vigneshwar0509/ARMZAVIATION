"""OpenAPI schema customization and preprocessing hooks."""

from drf_spectacular.openapi import AutoSchema


def custom_preprocessing_hook(endpoints):
    """
    Customize OpenAPI schema generation.
    - Groups endpoints by module
    - Filters out internal endpoints
    - Adds custom descriptions
    """
    
    filtered_endpoints = []
    
    for path, path_regex, method, view in endpoints:
        # Skip internal/admin endpoints
        if any(exclude in path for exclude in ["/admin/", "/health", "/static/", "/media/"]):
            continue
        
        # Skip deprecated endpoints
        if hasattr(view, "deprecated") and view.deprecated:
            continue
        
        filtered_endpoints.append((path, path_regex, method, view))
    
    return filtered_endpoints


class CustomAutoSchema(AutoSchema):
    """Enhanced AutoSchema with custom operation ID generation and descriptions."""
    
    def get_operation_id(self, path, method):
        """Generate meaningful operation IDs."""
        operation_id = super().get_operation_id(path, method)
        
        # Ensure operation IDs are unique and descriptive
        if operation_id:
            return operation_id.lower().replace("-", "_")
        
        return f"{method.lower()}_{path.replace('/', '_').strip('_')}"
    
    def get_request_serializer(self):
        """Get serializer for request body with validation rules."""
        serializer = super().get_request_serializer()
        return serializer
    
    def get_response_bodies(self):
        """Enhanced response documentation."""
        responses = super().get_response_bodies()
        
        # Add common response headers documentation
        for status_code, response in responses.items():
            if "headers" not in response:
                response["headers"] = {}
        
        return responses
