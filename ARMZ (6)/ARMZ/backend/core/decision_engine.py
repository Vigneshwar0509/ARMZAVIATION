"""
AI Decision Engine - Central brain for autonomous decision making
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

from django.conf import settings
from core.models import AIEventRecord


logger = logging.getLogger(__name__)


class DecisionType(Enum):
    RESPOND = "respond"
    CALL_TOOL = "call_tool"
    STORE_MEMORY = "store_memory"
    TRIGGER_JOB = "trigger_job"
    ALERT = "alert"


@dataclass
class Decision:
    type: DecisionType
    action: str
    params: Dict[str, Any]
    confidence: float
    reasoning: str


class DecisionEngine:
    """
    Central AI brain that analyzes requests and makes autonomous decisions
    """

    def __init__(self):
        self.tools = {}
        self.memory = None  # Will be set later

    async def analyze_request(self, request_data: Dict[str, Any], tenant=None) -> Decision:
        """
        Analyze incoming request and decide on action
        """
        try:
            # Log the analysis
            await self._log_event("request_analysis", {
                "request_data": request_data,
                "tenant_id": tenant.id if tenant else None
            })

            # Simple rule-based decision making (can be enhanced with ML)
            decision = await self._make_decision(request_data)

            # Log decision
            await self._log_event("decision_made", {
                "decision": decision.type.value,
                "action": decision.action,
                "confidence": decision.confidence
            })

            return decision

        except Exception as e:
            logger.error(f"Decision engine error: {e}")
            await self._log_event("decision_error", {"error": str(e)})
            # Fallback decision
            return Decision(
                type=DecisionType.RESPOND,
                action="error_response",
                params={"message": "Internal decision engine error"},
                confidence=1.0,
                reasoning="Error fallback"
            )

    async def _make_decision(self, request_data: Dict[str, Any]) -> Decision:
        """
        Core decision logic
        """
        query = request_data.get('query', '').lower()

        # Bug detection
        if any(word in query for word in ['error', 'bug', 'fix', 'broken']):
            return Decision(
                type=DecisionType.CALL_TOOL,
                action="debug_tool",
                params={"query": request_data.get('query')},
                confidence=0.8,
                reasoning="Detected bug-related query"
            )

        # Code analysis
        if any(word in query for word in ['analyze', 'review', 'check']):
            return Decision(
                type=DecisionType.CALL_TOOL,
                action="code_analysis_tool",
                params={"query": request_data.get('query')},
                confidence=0.7,
                reasoning="Detected analysis request"
            )

        # Security scan
        if any(word in query for word in ['security', 'vulnerable', 'hack']):
            return Decision(
                type=DecisionType.CALL_TOOL,
                action="security_scan_tool",
                params={"query": request_data.get('query')},
                confidence=0.9,
                reasoning="Detected security concern"
            )

        # System issue
        if any(word in query for word in ['system', 'server', 'down', 'alert']):
            return Decision(
                type=DecisionType.ALERT,
                action="system_alert",
                params={"message": request_data.get('query')},
                confidence=0.6,
                reasoning="Detected system issue"
            )

        # Default to LLM response
        return Decision(
            type=DecisionType.RESPOND,
            action="llm_response",
            params={"query": request_data.get('query')},
            confidence=0.5,
            reasoning="General query - use LLM"
        )

    async def execute_decision(self, decision: Decision, tenant=None) -> Dict[str, Any]:
        """
        Execute the decided action
        """
        try:
            if decision.type == DecisionType.CALL_TOOL:
                result = await self._call_tool(decision.action, decision.params, tenant)
            elif decision.type == DecisionType.STORE_MEMORY:
                result = await self._store_memory(decision.params)
            elif decision.type == DecisionType.TRIGGER_JOB:
                result = await self._trigger_job(decision.action, decision.params)
            elif decision.type == DecisionType.ALERT:
                result = await self._send_alert(decision.params)
            else:
                result = await self._generate_response(decision.params)

            await self._log_event("decision_executed", {
                "decision_type": decision.type.value,
                "result": "success"
            })

            return result

        except Exception as e:
            logger.error(f"Decision execution error: {e}")
            await self._log_event("execution_error", {"error": str(e)})
            return {"error": str(e)}

    async def _call_tool(self, tool_name: str, params: Dict[str, Any], tenant=None) -> Dict[str, Any]:
        """
        Call a registered tool
        """
        if tool_name not in self.tools:
            raise ValueError(f"Tool {tool_name} not registered")

        tool = self.tools[tool_name]
        return await tool.execute(params, tenant)

    async def _store_memory(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store information in memory
        """
        if self.memory:
            await self.memory.store(params)
        return {"status": "stored"}

    async def _trigger_job(self, job_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger background job
        """
        # Integration with Celery/RQ will be added
        return {"status": "job_triggered", "job": job_name}

    async def _send_alert(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send system alert
        """
        # Integration with alerting system
        logger.warning(f"System alert: {params}")
        return {"status": "alert_sent"}

    async def _generate_response(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate LLM response
        """
        # Placeholder for LLM integration
        return {"response": f"AI Response to: {params.get('query', '')}"}

    def register_tool(self, name: str, tool_instance):
        """
        Register a tool with the engine
        """
        self.tools[name] = tool_instance

    def set_memory(self, memory_instance):
        """
        Set the memory layer
        """
        self.memory = memory_instance

    async def _log_event(self, event_type: str, payload: Dict[str, Any]):
        """
        Log AI events with safe payload serialization.
        """
        try:
            safe_payload = self._sanitize_payload(payload)
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: AIEventRecord.objects.create(
                    event_type=event_type,
                    payload=safe_payload,
                ),
            )
        except Exception as e:
            logger.error(f"Failed to log event: {e}")

    def _sanitize_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        sanitized = {}
        for key, value in payload.items():
            if isinstance(value, (str, int, float, bool)) or value is None:
                sanitized[key] = value
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_payload(value)
            elif isinstance(value, list):
                sanitized[key] = [self._sanitize_payload(item) if isinstance(item, dict) else str(item) for item in value]
            else:
                sanitized[key] = str(value)
        return sanitized


# Global instance
decision_engine = DecisionEngine()