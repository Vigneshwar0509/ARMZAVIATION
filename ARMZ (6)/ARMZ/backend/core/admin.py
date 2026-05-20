from django.contrib import admin

from core.models import (
    AIEventRecord,
    AIDecisionLog,
    BackgroundJobRecord,
    MemoryRecord,
    SiteSetting,
    ToolExecutionRecord,
)

admin.site.register([SiteSetting, AIEventRecord, AIDecisionLog, BackgroundJobRecord, MemoryRecord, ToolExecutionRecord])
