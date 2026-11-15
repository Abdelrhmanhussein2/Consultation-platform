"""
tests/test_parent_laws_search.py
Tests server-side search, limit, and skip parameters on /api/legal/parent-laws
"""
import uuid
import pytest
from unittest.mock import MagicMock
from starlette.testclient import TestClient
from main import app
from routes.deps import get_current_user


@pytest.fixture
def admin_client():
    mock_admin = MagicMock()
    mock_admin.id = uuid.uuid4()
    mock_admin.role = "admin"
    app.dependency_overrides[get_current_user] = lambda: mock_admin
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_user, None)


def test_parent_laws_default(admin_client):
    res = admin_client.get("/api/legal/parent-laws")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        item = data[0]
        assert "id" in item
        assert "title" in item


def test_parent_laws_limit_and_skip(admin_client):
    res1 = admin_client.get("/api/legal/parent-laws?limit=2&skip=0")
    assert res1.status_code == 200
    items1 = res1.json()
    assert len(items1) <= 2

    res2 = admin_client.get("/api/legal/parent-laws?limit=2&skip=2")
    assert res2.status_code == 200
    items2 = res2.json()
    assert len(items2) <= 2

    # If both have elements, they shouldn't share the first element
    if items1 and items2:
        assert items1[0]["id"] != items2[0]["id"]


def test_parent_laws_server_search(admin_client):
    # Searching for nonexistent term returns empty list
    res = admin_client.get("/api/legal/parent-laws?q=NON_EXISTENT_LAW_QUERY_XYZ_123")
    assert res.status_code == 200
    assert res.json() == []
