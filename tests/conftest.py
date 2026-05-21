"""Shared pytest configuration and fixtures."""

import pytest
import logging


@pytest.fixture(autouse=True)
def setup_logging(caplog):
    """Enable logging capture for all tests."""
    caplog.set_level(logging.DEBUG)
