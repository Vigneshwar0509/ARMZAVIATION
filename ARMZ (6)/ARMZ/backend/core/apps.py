from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        from .decision_engine import decision_engine
        from .memory import RedisMemory
        from .tools.debug_tool import DebugTool
        from .tools.code_analysis_tool import CodeAnalysisTool
        from .tools.security_scan_tool import SecurityScanTool

        decision_engine.register_tool(
            "debug_tool",
            DebugTool("debug_tool", "Automatic debugging and issue triage"),
        )
        decision_engine.register_tool(
            "code_analysis_tool",
            CodeAnalysisTool("code_analysis_tool", "Static code review and improvement suggestions"),
        )
        decision_engine.register_tool(
            "security_scan_tool",
            SecurityScanTool("security_scan_tool", "Security assessment and vulnerability scanning"),
        )
        decision_engine.set_memory(RedisMemory())
