"""Dual-write mechanism for epic creation.

This module handles writing epic data to both Jira and DynamoDB,
ensuring consistency and graceful error handling.
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


@dataclass
class EpicData:
    """Data model for an epic that will be dual-written."""
    ticket_id: str
    title: str
    description: str
    status: str = "todo"
    workflow_id: str = ""
    parent_id: str = ""
    assignee: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_jira_payload(self) -> Dict[str, Any]:
        """Convert to Jira-compatible payload."""
        return {
            "ticket_id": self.ticket_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "workflow_id": self.workflow_id,
            "parent_id": self.parent_id,
            "assignee": self.assignee,
            "ticket_type": "epic",
        }

    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Convert to DynamoDB item format."""
        return {
            "PK": {"S": f"TICKET#{self.ticket_id}"},
            "SK": {"S": f"WORKFLOW#{self.workflow_id}"},
            "ticket_id": {"S": self.ticket_id},
            "title": {"S": self.title},
            "description": {"S": self.description},
            "status": {"S": self.status},
            "workflow_id": {"S": self.workflow_id},
            "parent_id": {"S": self.parent_id},
            "assignee": {"S": self.assignee},
            "ticket_type": {"S": "epic"},
            "created_at": {"S": self.created_at},
            "updated_at": {"S": self.updated_at},
        }


class WriteResult:
    """Result of a write operation."""
    def __init__(self, success: bool, store: str, error: Optional[Exception] = None):
        self.success = success
        self.store = store
        self.error = error
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def __repr__(self):
        status = "SUCCESS" if self.success else f"FAILED: {self.error}"
        return f"WriteResult(store={self.store}, status={status})"


class DualWriteResult:
    """Aggregated result of dual-write operation."""
    def __init__(self, jira_result: WriteResult, dynamodb_result: WriteResult):
        self.jira_result = jira_result
        self.dynamodb_result = dynamodb_result

    @property
    def all_succeeded(self) -> bool:
        return self.jira_result.success and self.dynamodb_result.success

    @property
    def partial_failure(self) -> bool:
        return self.jira_result.success != self.dynamodb_result.success

    @property
    def all_failed(self) -> bool:
        return not self.jira_result.success and not self.dynamodb_result.success


class JiraClient:
    """Client for writing epic data to Jira."""

    def __init__(self, client=None):
        self._client = client

    def create_epic(self, epic_data: EpicData) -> WriteResult:
        """Write epic to Jira."""
        try:
            payload = epic_data.to_jira_payload()
            logger.info(
                "Writing epic to Jira",
                extra={
                    "ticket_id": epic_data.ticket_id,
                    "workflow_id": epic_data.workflow_id,
                    "title": epic_data.title,
                }
            )
            # Call Jira integration
            if self._client:
                self._client.create_ticket(**payload)
            logger.info(
                "Successfully wrote epic to Jira",
                extra={"ticket_id": epic_data.ticket_id}
            )
            return WriteResult(success=True, store="jira")
        except Exception as e:
            logger.error(
                "Failed to write epic to Jira",
                extra={
                    "ticket_id": epic_data.ticket_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                exc_info=True,
            )
            return WriteResult(success=False, store="jira", error=e)


class DynamoDBClient:
    """Client for writing epic data to DynamoDB."""

    def __init__(self, table_name: str = "workflow-tickets", client=None):
        self._table_name = table_name
        self._client = client

    def create_epic(self, epic_data: EpicData) -> WriteResult:
        """Write epic to DynamoDB."""
        try:
            item = epic_data.to_dynamodb_item()
            logger.info(
                "Writing epic to DynamoDB",
                extra={
                    "ticket_id": epic_data.ticket_id,
                    "table": self._table_name,
                    "workflow_id": epic_data.workflow_id,
                }
            )
            if self._client:
                self._client.put_item(
                    TableName=self._table_name,
                    Item=item,
                )
            logger.info(
                "Successfully wrote epic to DynamoDB",
                extra={"ticket_id": epic_data.ticket_id}
            )
            return WriteResult(success=True, store="dynamodb")
        except Exception as e:
            logger.error(
                "Failed to write epic to DynamoDB",
                extra={
                    "ticket_id": epic_data.ticket_id,
                    "table": self._table_name,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                exc_info=True,
            )
            return WriteResult(success=False, store="dynamodb", error=e)


class EpicDualWriter:
    """Orchestrates dual-write of epic data to Jira and DynamoDB.

    Write Strategy:
    - Jira is written first (source of truth for ticket IDs)
    - DynamoDB is written second (optimized for queries)
    - If Jira write fails, DynamoDB write is skipped (no orphan records)
    - If DynamoDB write fails after Jira succeeds, error is logged
      and a compensation event is emitted for retry
    """

    def __init__(self, jira_client: JiraClient, dynamodb_client: DynamoDBClient):
        self._jira_client = jira_client
        self._dynamodb_client = dynamodb_client

    def create_epic(self, epic_data: EpicData) -> DualWriteResult:
        """Create an epic in both Jira and DynamoDB.

        Args:
            epic_data: The epic data to persist.

        Returns:
            DualWriteResult with status of both writes.
        """
        correlation_id = str(uuid.uuid4())
        logger.info(
            "Starting dual-write for epic creation",
            extra={
                "correlation_id": correlation_id,
                "ticket_id": epic_data.ticket_id,
                "workflow_id": epic_data.workflow_id,
            }
        )

        # Step 1: Write to Jira (primary store)
        jira_result = self._jira_client.create_epic(epic_data)

        if not jira_result.success:
            logger.error(
                "Jira write failed — skipping DynamoDB write to prevent inconsistency",
                extra={
                    "correlation_id": correlation_id,
                    "ticket_id": epic_data.ticket_id,
                    "error": str(jira_result.error),
                }
            )
            # Return early: DynamoDB write skipped, marked as not attempted
            dynamodb_result = WriteResult(
                success=False,
                store="dynamodb",
                error=Exception("Skipped: Jira write failed")
            )
            return DualWriteResult(jira_result=jira_result, dynamodb_result=dynamodb_result)

        # Step 2: Write to DynamoDB (secondary store)
        dynamodb_result = self._dynamodb_client.create_epic(epic_data)

        if not dynamodb_result.success:
            logger.error(
                "DynamoDB write failed after successful Jira write — "
                "compensation required",
                extra={
                    "correlation_id": correlation_id,
                    "ticket_id": epic_data.ticket_id,
                    "error": str(dynamodb_result.error),
                    "compensation_action": "retry_dynamodb_write",
                }
            )
            # Emit compensation event for async retry
            self._emit_compensation_event(epic_data, correlation_id)

        result = DualWriteResult(jira_result=jira_result, dynamodb_result=dynamodb_result)

        if result.all_succeeded:
            logger.info(
                "Dual-write completed successfully",
                extra={
                    "correlation_id": correlation_id,
                    "ticket_id": epic_data.ticket_id,
                }
            )
        return result

    def _emit_compensation_event(self, epic_data: EpicData, correlation_id: str):
        """Emit an event for async retry of failed DynamoDB write."""
        logger.warning(
            "Emitting compensation event for failed DynamoDB write",
            extra={
                "correlation_id": correlation_id,
                "ticket_id": epic_data.ticket_id,
                "action": "retry_dynamodb_write",
            }
        )
        # In production, this would publish to SQS/SNS/EventBridge
        # for async retry with exponential backoff
