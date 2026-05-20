"""
Base tool interface
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import asyncio


class BaseTool(ABC):
    """
    Abstract base class for all AI tools
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @property
    @abstractmethod
    def input_schema(self) -> Dict[str, Any]:
        """
        JSON schema for tool input validation
        """
        pass

    @abstractmethod
    async def execute(self, params: Dict[str, Any], tenant=None) -> Dict[str, Any]:
        """
        Execute the tool with given parameters
        """
        pass

    def validate_input(self, params: Dict[str, Any]) -> bool:
        """
        Validate input parameters against schema
        """
        # Basic validation - can be enhanced with jsonschema
        required_fields = self.input_schema.get('required', [])
        for field in required_fields:
            if field not in params:
                return False
        return True