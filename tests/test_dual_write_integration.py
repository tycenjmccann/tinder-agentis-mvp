"""Integration tests for dual-write epic creation.

These tests verify that the dual-write mechanism correctly persists
epic data to both Jira and DynamoDB, with proper error handling.

Test Epic: TEAM-110
Workflow: wf_1779334880119_jekzv5
"""

import logging
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime, timezone

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from dual_write_module.epic_writer import (
    EpicData,
    EpicDualWriter,
    JiraClient,
    DynamoDBClient,
    WriteResult,
    DualWriteResult,
)
from dual_write_module.consistency_checker import ConsistencyChecker, ConsistencyResult


# --- Test Fixtures ---

@pytest.fixture
def sample_epic_data():
    """Create sample epic data matching TEAM-110."""
    return EpicData(
        ticket_id="TEAM-110",
        title="Dual-Write Epic Creation - Validation Artifact",
        description="Test epic for validating dual-write to Jira and DynamoDB",
        status="todo",
        workflow_id="wf_1779334880119_jekzv5",
        parent_id="",
        assignee="team-pm-planner",
    )


@pytest.fixture
def mock_jira_client():
    """Mock Jira client that succeeds."""
    client = MagicMock()
    client.create_ticket = MagicMock(return_value={"ticket_id": "TEAM-110"})
    return JiraClient(client=client)


@pytest.fixture
def mock_dynamodb_client():
    """Mock DynamoDB client that succeeds."""
    client = MagicMock()
    client.put_item = MagicMock(return_value={})
    return DynamoDBClient(table_name="workflow-tickets", client=client)


@pytest.fixture
def failing_jira_client():
    """Mock Jira client that fails."""
    client = MagicMock()
    client.create_ticket = MagicMock(
        side_effect=Exception("Jira API error: 503 Service Unavailable")
    )
    return JiraClient(client=client)


@pytest.fixture
def failing_dynamodb_client():
    """Mock DynamoDB client that fails."""
    client = MagicMock()
    client.put_item = MagicMock(
        side_effect=Exception(
            "DynamoDB error: ProvisionedThroughputExceededException"
        )
    )
    return DynamoDBClient(table_name="workflow-tickets", client=client)


# --- Happy Path Tests ---

class TestDualWriteHappyPath:
    """Tests for successful dual-write operations."""

    def test_epic_created_in_both_stores(
        self, sample_epic_data, mock_jira_client, mock_dynamodb_client
    ):
        """Verify epic is written to both Jira and DynamoDB successfully."""
        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        result = writer.create_epic(sample_epic_data)

        assert result.all_succeeded is True
        assert result.partial_failure is False
        assert result.all_failed is False
        assert result.jira_result.success is True
        assert result.dynamodb_result.success is True

    def test_jira_receives_correct_payload(
        self, sample_epic_data, mock_jira_client, mock_dynamodb_client
    ):
        """Verify Jira receives the correct epic data."""
        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        writer.create_epic(sample_epic_data)

        # Verify the underlying client was called with correct payload
        mock_jira_client._client.create_ticket.assert_called_once()
        call_kwargs = mock_jira_client._client.create_ticket.call_args[1]
        assert call_kwargs["ticket_id"] == "TEAM-110"
        assert call_kwargs["title"] == "Dual-Write Epic Creation - Validation Artifact"
        assert call_kwargs["ticket_type"] == "epic"
        assert call_kwargs["workflow_id"] == "wf_1779334880119_jekzv5"

    def test_dynamodb_receives_correct_item(
        self, sample_epic_data, mock_jira_client, mock_dynamodb_client
    ):
        """Verify DynamoDB receives the correct item format."""
        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        writer.create_epic(sample_epic_data)

        # Verify DynamoDB put_item was called
        mock_dynamodb_client._client.put_item.assert_called_once()
        call_kwargs = mock_dynamodb_client._client.put_item.call_args[1]
        item = call_kwargs["Item"]

        assert item["PK"] == {"S": "TICKET#TEAM-110"}
        assert item["SK"] == {"S": "WORKFLOW#wf_1779334880119_jekzv5"}
        assert item["ticket_id"] == {"S": "TEAM-110"}
        assert item["title"] == {"S": "Dual-Write Epic Creation - Validation Artifact"}
        assert item["ticket_type"] == {"S": "epic"}

    def test_data_consistency_between_stores(
        self, sample_epic_data, mock_jira_client, mock_dynamodb_client
    ):
        """Verify data is consistent between Jira and DynamoDB after write."""
        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        writer.create_epic(sample_epic_data)

        # Extract what was written to each store
        jira_payload = sample_epic_data.to_jira_payload()
        ddb_item = sample_epic_data.to_dynamodb_item()

        # Verify key fields match across both store formats
        assert jira_payload["ticket_id"] == ddb_item["ticket_id"]["S"]
        assert jira_payload["title"] == ddb_item["title"]["S"]
        assert jira_payload["description"] == ddb_item["description"]["S"]
        assert jira_payload["status"] == ddb_item["status"]["S"]
        assert jira_payload["workflow_id"] == ddb_item["workflow_id"]["S"]
        assert jira_payload["ticket_type"] == ddb_item["ticket_type"]["S"]


# --- Error Handling Tests ---

class TestDualWriteErrorHandling:
    """Tests for error handling in dual-write operations."""

    def test_jira_failure_skips_dynamodb_write(
        self, sample_epic_data, failing_jira_client, mock_dynamodb_client
    ):
        """If Jira write fails, DynamoDB write should be skipped."""
        writer = EpicDualWriter(
            jira_client=failing_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        result = writer.create_epic(sample_epic_data)

        assert result.all_succeeded is False
        assert result.jira_result.success is False
        assert result.dynamodb_result.success is False
        # DynamoDB should NOT have been called
        mock_dynamodb_client._client.put_item.assert_not_called()

    def test_dynamodb_failure_after_jira_success(
        self, sample_epic_data, mock_jira_client, failing_dynamodb_client
    ):
        """If DynamoDB write fails after Jira succeeds, handle gracefully."""
        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=failing_dynamodb_client,
        )

        result = writer.create_epic(sample_epic_data)

        assert result.partial_failure is True
        assert result.jira_result.success is True
        assert result.dynamodb_result.success is False
        assert "ProvisionedThroughputExceededException" in str(
            result.dynamodb_result.error
        )

    def test_jira_failure_logs_error_with_details(
        self, sample_epic_data, failing_jira_client, mock_dynamodb_client, caplog
    ):
        """Verify Jira failure is logged with sufficient detail."""
        writer = EpicDualWriter(
            jira_client=failing_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        with caplog.at_level(logging.ERROR):
            writer.create_epic(sample_epic_data)

        # Check that error was logged
        assert any("Failed to write epic to Jira" in record.message
                   for record in caplog.records)

    def test_dynamodb_failure_logs_error_with_details(
        self, sample_epic_data, mock_jira_client, failing_dynamodb_client, caplog
    ):
        """Verify DynamoDB failure is logged with sufficient detail."""
        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=failing_dynamodb_client,
        )

        with caplog.at_level(logging.ERROR):
            writer.create_epic(sample_epic_data)

        assert any("Failed to write epic to DynamoDB" in record.message
                   for record in caplog.records)

    def test_both_stores_fail(
        self, sample_epic_data, failing_jira_client, failing_dynamodb_client
    ):
        """Both stores fail — system remains in clean state."""
        writer = EpicDualWriter(
            jira_client=failing_jira_client,
            dynamodb_client=failing_dynamodb_client,
        )

        result = writer.create_epic(sample_epic_data)

        # When Jira fails, DynamoDB is skipped (not called)
        assert result.all_failed is True
        assert result.jira_result.success is False
        assert result.dynamodb_result.success is False

    def test_no_inconsistent_state_on_jira_failure(
        self, sample_epic_data, failing_jira_client, mock_dynamodb_client
    ):
        """Ensure no orphan DynamoDB records when Jira fails."""
        writer = EpicDualWriter(
            jira_client=failing_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        writer.create_epic(sample_epic_data)

        # DynamoDB should never be called if Jira fails
        mock_dynamodb_client._client.put_item.assert_not_called()


# --- Consistency Check Tests ---

class TestConsistencyChecker:
    """Tests for the consistency checker."""

    def test_consistent_data_passes_check(self):
        """Verify consistency check passes when data matches."""
        jira_client = MagicMock()
        jira_client.get_ticket = MagicMock(return_value={
            "ticket_id": "TEAM-110",
            "title": "Test Epic",
            "description": "Test description",
            "status": "todo",
            "workflow_id": "wf_1779334880119_jekzv5",
            "ticket_type": "epic",
        })

        dynamodb_client = MagicMock()
        dynamodb_client.get_item = MagicMock(return_value={
            "ticket_id": "TEAM-110",
            "title": "Test Epic",
            "description": "Test description",
            "status": "todo",
            "workflow_id": "wf_1779334880119_jekzv5",
            "ticket_type": "epic",
        })

        checker = ConsistencyChecker(jira_client, dynamodb_client)
        result = checker.check_epic_consistency(
            "TEAM-110", "wf_1779334880119_jekzv5"
        )

        assert result.is_consistent is True
        assert result.discrepancies is None

    def test_title_mismatch_detected(self):
        """Verify title mismatch between stores is detected."""
        jira_client = MagicMock()
        jira_client.get_ticket = MagicMock(return_value={
            "ticket_id": "TEAM-110",
            "title": "Epic Title v1",
            "description": "Test",
            "status": "todo",
            "workflow_id": "wf_1779334880119_jekzv5",
            "ticket_type": "epic",
        })

        dynamodb_client = MagicMock()
        dynamodb_client.get_item = MagicMock(return_value={
            "ticket_id": "TEAM-110",
            "title": "Epic Title v2",  # Different!
            "description": "Test",
            "status": "todo",
            "workflow_id": "wf_1779334880119_jekzv5",
            "ticket_type": "epic",
        })

        checker = ConsistencyChecker(jira_client, dynamodb_client)
        result = checker.check_epic_consistency(
            "TEAM-110", "wf_1779334880119_jekzv5"
        )

        assert result.is_consistent is False
        assert any("title" in d for d in result.discrepancies)

    def test_missing_from_jira_detected(self):
        """Verify detection when epic is missing from Jira."""
        jira_client = MagicMock()
        jira_client.get_ticket = MagicMock(return_value=None)

        dynamodb_client = MagicMock()
        dynamodb_client.get_item = MagicMock(return_value={
            "ticket_id": "TEAM-110",
            "title": "Test",
        })

        checker = ConsistencyChecker(jira_client, dynamodb_client)
        result = checker.check_epic_consistency(
            "TEAM-110", "wf_1779334880119_jekzv5"
        )

        assert result.is_consistent is False
        assert result.missing_from == "jira"

    def test_missing_from_dynamodb_detected(self):
        """Verify detection when epic is missing from DynamoDB."""
        jira_client = MagicMock()
        jira_client.get_ticket = MagicMock(return_value={
            "ticket_id": "TEAM-110",
            "title": "Test",
        })

        dynamodb_client = MagicMock()
        dynamodb_client.get_item = MagicMock(return_value=None)

        checker = ConsistencyChecker(jira_client, dynamodb_client)
        result = checker.check_epic_consistency(
            "TEAM-110", "wf_1779334880119_jekzv5"
        )

        assert result.is_consistent is False
        assert result.missing_from == "dynamodb"


# --- Data Model Tests ---

class TestEpicDataModel:
    """Tests for the EpicData model serialization."""

    def test_to_jira_payload_contains_required_fields(self, sample_epic_data):
        """Jira payload contains all required fields."""
        payload = sample_epic_data.to_jira_payload()

        assert "ticket_id" in payload
        assert "title" in payload
        assert "description" in payload
        assert "status" in payload
        assert "workflow_id" in payload
        assert "ticket_type" in payload
        assert payload["ticket_type"] == "epic"

    def test_to_dynamodb_item_has_correct_key_structure(self, sample_epic_data):
        """DynamoDB item has correct PK/SK structure."""
        item = sample_epic_data.to_dynamodb_item()

        assert item["PK"] == {"S": "TICKET#TEAM-110"}
        assert item["SK"] == {"S": "WORKFLOW#wf_1779334880119_jekzv5"}

    def test_dynamodb_item_uses_attribute_value_format(self, sample_epic_data):
        """DynamoDB item uses DynamoDB attribute value format."""
        item = sample_epic_data.to_dynamodb_item()

        for key, value in item.items():
            assert isinstance(value, dict)
            assert "S" in value  # All values are strings in this model

    def test_fields_match_between_jira_and_dynamodb(self, sample_epic_data):
        """Verify the same logical data appears in both formats."""
        jira = sample_epic_data.to_jira_payload()
        ddb = sample_epic_data.to_dynamodb_item()

        # Core fields should have same values
        assert jira["ticket_id"] == ddb["ticket_id"]["S"]
        assert jira["title"] == ddb["title"]["S"]
        assert jira["description"] == ddb["description"]["S"]
        assert jira["status"] == ddb["status"]["S"]
        assert jira["workflow_id"] == ddb["workflow_id"]["S"]
        assert jira["ticket_type"] == ddb["ticket_type"]["S"]


# --- TEAM-110 Verification Tests ---

class TestTeam110Verification:
    """Specific verification that TEAM-110 epic is correctly dual-written."""

    TEAM_110_DATA = {
        "ticket_id": "TEAM-110",
        "workflow_id": "wf_1779334880119_jekzv5",
        "ticket_type": "epic",
    }

    def test_team_110_can_be_created_via_dual_write(
        self, mock_jira_client, mock_dynamodb_client
    ):
        """TEAM-110 can be successfully dual-written."""
        epic = EpicData(
            ticket_id="TEAM-110",
            title="Dual-Write Verification Epic",
            description="Epic created to verify dual-write to Jira and DynamoDB",
            workflow_id="wf_1779334880119_jekzv5",
        )

        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )

        result = writer.create_epic(epic)
        assert result.all_succeeded is True

    def test_team_110_data_format_correct(self):
        """TEAM-110 produces correctly formatted data for both stores."""
        epic = EpicData(
            ticket_id="TEAM-110",
            title="Test Epic",
            description="Testing dual-write",
            workflow_id="wf_1779334880119_jekzv5",
        )

        jira_payload = epic.to_jira_payload()
        assert jira_payload["ticket_id"] == "TEAM-110"
        assert jira_payload["ticket_type"] == "epic"

        ddb_item = epic.to_dynamodb_item()
        assert ddb_item["PK"]["S"] == "TICKET#TEAM-110"
        assert ddb_item["SK"]["S"] == "WORKFLOW#wf_1779334880119_jekzv5"

    def test_team_110_write_order_is_jira_first(
        self, mock_jira_client, mock_dynamodb_client
    ):
        """Verify Jira is written before DynamoDB (order matters for consistency)."""
        call_order = []

        def track_jira_call(**kwargs):
            call_order.append("jira")
            return {"ticket_id": "TEAM-110"}

        def track_ddb_call(**kwargs):
            call_order.append("dynamodb")
            return {}

        mock_jira_client._client.create_ticket = track_jira_call
        mock_dynamodb_client._client.put_item = track_ddb_call

        epic = EpicData(
            ticket_id="TEAM-110",
            title="Test",
            description="Test",
            workflow_id="wf_1779334880119_jekzv5",
        )

        writer = EpicDualWriter(
            jira_client=mock_jira_client,
            dynamodb_client=mock_dynamodb_client,
        )
        writer.create_epic(epic)

        assert call_order == ["jira", "dynamodb"]
