"""Consistency checker for dual-write stores.

Validates that data in Jira and DynamoDB is consistent
after dual-write operations.
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ConsistencyResult:
    """Result of a consistency check between stores."""
    ticket_id: str
    is_consistent: bool
    jira_data: Optional[Dict[str, Any]] = None
    dynamodb_data: Optional[Dict[str, Any]] = None
    discrepancies: Optional[List[str]] = None
    missing_from: Optional[str] = None

    def __repr__(self):
        if self.is_consistent:
            return f"ConsistencyResult(ticket_id={self.ticket_id}, CONSISTENT)"
        return (
            f"ConsistencyResult(ticket_id={self.ticket_id}, INCONSISTENT, "
            f"discrepancies={self.discrepancies}, missing_from={self.missing_from})"
        )


class ConsistencyChecker:
    """Checks consistency between Jira and DynamoDB stores."""

    FIELDS_TO_CHECK = [
        "ticket_id",
        "title",
        "description",
        "status",
        "workflow_id",
        "ticket_type",
    ]

    def __init__(self, jira_client, dynamodb_client):
        self._jira_client = jira_client
        self._dynamodb_client = dynamodb_client

    def check_epic_consistency(self, ticket_id: str, workflow_id: str) -> ConsistencyResult:
        """Check that an epic exists and is consistent in both stores.

        Args:
            ticket_id: The ticket ID to verify (e.g., 'TEAM-110')
            workflow_id: The workflow ID for DynamoDB lookup

        Returns:
            ConsistencyResult with details of any discrepancies.
        """
        logger.info(
            "Checking consistency for epic",
            extra={"ticket_id": ticket_id, "workflow_id": workflow_id}
        )

        # Fetch from Jira
        jira_data = self._fetch_from_jira(ticket_id)
        if jira_data is None:
            return ConsistencyResult(
                ticket_id=ticket_id,
                is_consistent=False,
                missing_from="jira",
                discrepancies=[f"Epic {ticket_id} not found in Jira"],
            )

        # Fetch from DynamoDB
        dynamodb_data = self._fetch_from_dynamodb(ticket_id, workflow_id)
        if dynamodb_data is None:
            return ConsistencyResult(
                ticket_id=ticket_id,
                is_consistent=False,
                jira_data=jira_data,
                missing_from="dynamodb",
                discrepancies=[f"Epic {ticket_id} not found in DynamoDB"],
            )

        # Compare fields
        discrepancies = self._compare_fields(jira_data, dynamodb_data)

        result = ConsistencyResult(
            ticket_id=ticket_id,
            is_consistent=len(discrepancies) == 0,
            jira_data=jira_data,
            dynamodb_data=dynamodb_data,
            discrepancies=discrepancies if discrepancies else None,
        )

        if result.is_consistent:
            logger.info(
                "Epic is consistent across both stores",
                extra={"ticket_id": ticket_id}
            )
        else:
            logger.warning(
                "Epic inconsistency detected",
                extra={
                    "ticket_id": ticket_id,
                    "discrepancies": discrepancies,
                }
            )

        return result

    def _fetch_from_jira(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Fetch epic data from Jira."""
        try:
            return self._jira_client.get_ticket(ticket_id)
        except Exception as e:
            logger.error(
                "Failed to fetch from Jira for consistency check",
                extra={"ticket_id": ticket_id, "error": str(e)}
            )
            return None

    def _fetch_from_dynamodb(self, ticket_id: str, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Fetch epic data from DynamoDB."""
        try:
            return self._dynamodb_client.get_item(
                pk=f"TICKET#{ticket_id}",
                sk=f"WORKFLOW#{workflow_id}",
            )
        except Exception as e:
            logger.error(
                "Failed to fetch from DynamoDB for consistency check",
                extra={"ticket_id": ticket_id, "error": str(e)}
            )
            return None

    def _compare_fields(
        self, jira_data: Dict[str, Any], dynamodb_data: Dict[str, Any]
    ) -> List[str]:
        """Compare fields between Jira and DynamoDB records."""
        discrepancies = []

        for field_name in self.FIELDS_TO_CHECK:
            jira_value = jira_data.get(field_name)
            ddb_value = dynamodb_data.get(field_name)

            if jira_value != ddb_value:
                discrepancies.append(
                    f"Field '{field_name}' mismatch: "
                    f"Jira='{jira_value}' vs DynamoDB='{ddb_value}'"
                )

        return discrepancies
