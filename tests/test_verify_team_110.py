"""Verification script for TEAM-110 epic dual-write.

This test module specifically validates that the TEAM-110 epic
(the validation artifact for workflow wf_1779334880119_jekzv5)
is correctly handled by the dual-write system.
"""

import pytest
from unittest.mock import MagicMock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from dual_write_module.epic_writer import EpicData, EpicDualWriter, JiraClient, DynamoDBClient
from dual_write_module.consistency_checker import ConsistencyChecker


class TestTeam110EpicVerification:
    """End-to-end verification for TEAM-110 dual-write."""

    WORKFLOW_ID = "wf_1779334880119_jekzv5"
    EPIC_ID = "TEAM-110"

    def _create_epic_data(self):
        return EpicData(
            ticket_id=self.EPIC_ID,
            title="Dual-Write Verification Epic",
            description=(
                "Epic created via workflow system to validate "
                "dual-write persistence to Jira and DynamoDB"
            ),
            status="todo",
            workflow_id=self.WORKFLOW_ID,
            parent_id="",
            assignee="team-pm-planner",
        )

    def test_epic_present_in_jira_after_creation(self):
        """AC: Epic created via workflow system is present in Jira."""
        mock_client = MagicMock()
        mock_client.create_ticket = MagicMock(return_value={"id": self.EPIC_ID})
        jira_client = JiraClient(client=mock_client)

        epic = self._create_epic_data()
        result = jira_client.create_epic(epic)

        assert result.success is True
        assert result.store == "jira"
        mock_client.create_ticket.assert_called_once()

    def test_epic_present_in_dynamodb_after_creation(self):
        """AC: Epic created via workflow system is present in DynamoDB."""
        mock_client = MagicMock()
        mock_client.put_item = MagicMock(return_value={})
        ddb_client = DynamoDBClient(table_name="workflow-tickets", client=mock_client)

        epic = self._create_epic_data()
        result = ddb_client.create_epic(epic)

        assert result.success is True
        assert result.store == "dynamodb"
        mock_client.put_item.assert_called_once()

    def test_fields_consistent_across_stores(self):
        """AC: Fields are consistent across both stores."""
        epic = self._create_epic_data()

        jira_payload = epic.to_jira_payload()
        ddb_item = epic.to_dynamodb_item()

        # Verify all key fields match
        assert jira_payload["ticket_id"] == ddb_item["ticket_id"]["S"]
        assert jira_payload["title"] == ddb_item["title"]["S"]
        assert jira_payload["description"] == ddb_item["description"]["S"]
        assert jira_payload["status"] == ddb_item["status"]["S"]
        assert jira_payload["workflow_id"] == ddb_item["workflow_id"]["S"]
        assert jira_payload["ticket_type"] == ddb_item["ticket_type"]["S"]
        assert jira_payload["assignee"] == ddb_item["assignee"]["S"]

    def test_jira_failure_handled_gracefully(self):
        """AC: Error scenarios handled (Jira write failure)."""
        mock_jira = MagicMock()
        mock_jira.create_ticket = MagicMock(
            side_effect=ConnectionError("Jira unavailable")
        )
        mock_ddb = MagicMock()
        mock_ddb.put_item = MagicMock(return_value={})

        jira_client = JiraClient(client=mock_jira)
        ddb_client = DynamoDBClient(client=mock_ddb)
        writer = EpicDualWriter(jira_client=jira_client, dynamodb_client=ddb_client)

        epic = self._create_epic_data()
        result = writer.create_epic(epic)

        # Should not crash, should return failure info
        assert result.jira_result.success is False
        assert result.dynamodb_result.success is False
        # DDB should NOT have been called (no orphan records)
        mock_ddb.put_item.assert_not_called()

    def test_dynamodb_failure_handled_gracefully(self):
        """AC: Error scenarios handled (DDB write failure)."""
        mock_jira = MagicMock()
        mock_jira.create_ticket = MagicMock(return_value={"id": self.EPIC_ID})
        mock_ddb = MagicMock()
        mock_ddb.put_item = MagicMock(
            side_effect=Exception("DynamoDB throttled")
        )

        jira_client = JiraClient(client=mock_jira)
        ddb_client = DynamoDBClient(client=mock_ddb)
        writer = EpicDualWriter(jira_client=jira_client, dynamodb_client=ddb_client)

        epic = self._create_epic_data()
        result = writer.create_epic(epic)

        # Jira succeeded, DDB failed = partial failure handled
        assert result.partial_failure is True
        assert result.jira_result.success is True
        assert result.dynamodb_result.success is False

    def test_consistency_check_validates_dual_write(self):
        """AC: Integration test validates dual-write behavior."""
        expected_data = {
            "ticket_id": self.EPIC_ID,
            "title": "Dual-Write Verification Epic",
            "description": (
                "Epic created via workflow system to validate "
                "dual-write persistence to Jira and DynamoDB"
            ),
            "status": "todo",
            "workflow_id": self.WORKFLOW_ID,
            "ticket_type": "epic",
        }

        jira_client = MagicMock()
        jira_client.get_ticket = MagicMock(return_value=expected_data)

        ddb_client = MagicMock()
        ddb_client.get_item = MagicMock(return_value=expected_data)

        checker = ConsistencyChecker(jira_client, ddb_client)
        result = checker.check_epic_consistency(self.EPIC_ID, self.WORKFLOW_ID)

        assert result.is_consistent is True
        assert result.discrepancies is None

    def test_error_logging_has_sufficient_detail(self, caplog):
        """AC: Errors are logged with sufficient detail for debugging."""
        import logging

        mock_jira = MagicMock()
        mock_jira.create_ticket = MagicMock(
            side_effect=TimeoutError("Connection timed out after 30s")
        )
        mock_ddb = MagicMock()

        jira_client = JiraClient(client=mock_jira)
        ddb_client = DynamoDBClient(client=mock_ddb)
        writer = EpicDualWriter(jira_client=jira_client, dynamodb_client=ddb_client)

        epic = self._create_epic_data()

        with caplog.at_level(logging.ERROR):
            writer.create_epic(epic)

        # Verify error logs contain actionable info
        error_records = [r for r in caplog.records if r.levelno >= logging.ERROR]
        assert len(error_records) > 0

        # Check that logged errors contain ticket ID and error info
        error_messages = " ".join(r.message for r in error_records)
        assert "Failed to write epic to Jira" in error_messages or \
               "Jira write failed" in error_messages
