"""
test_app.py — Tests unitaires de l'API NexaCloud
Lancés par pytest dans le pipeline CI.
"""

import pytest
from app import app


@pytest.fixture
def client():
    app.testing = True
    return app.test_client()


def test_index_status(client):
    """La route / retourne 200 avec le statut ok."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
    assert data["service"] == "NexaCloud API"


def test_health(client):
    """La route /health retourne healthy."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "healthy"


def test_logs_summary_structure(client):
    """Le résumé de logs contient les 4 niveaux attendus."""
    response = client.get("/logs/summary")
    assert response.status_code == 200
    data = response.get_json()
    for niveau in ("info", "warning", "error", "critical"):
        assert niveau in data
        assert isinstance(data[niveau], int)


def test_logs_summary_values(client):
    """Les compteurs de logs ont les valeurs attendues."""
    response = client.get("/logs/summary")
    data = response.get_json()
    assert data["info"] == 142
    assert data["warning"] == 28
    assert data["error"] == 12
    assert data["critical"] == 3


def test_logs_critical_alerte(client):
    """L'alerte est active quand il y a des critiques."""
    response = client.get("/logs/critical")
    assert response.status_code == 200
    data = response.get_json()
    assert "critical_count" in data
    assert "alerte" in data
    assert data["alerte"] is True


def test_logs_error_alerte(client):
    """L'alerte est active quand il y a des erreurs."""
    response = client.get("/logs/error")
    assert response.status_code == 200
    data = response.get_json()
    assert "error_count" in data
    assert "alerte" in data
    assert data["alerte"] is True
