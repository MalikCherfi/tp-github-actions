"""
app.py — API NexaCloud
Mini API Flask utilisée comme cible du pipeline CI/CD dans le TP GitHub Actions.
"""

from flask import Flask, jsonify

app = Flask(__name__)

# Simule un résumé de logs issu du TP Bash / PowerShell
LOG_SUMMARY = {
    "info": 150,
    "warning": 28,
    "error": 12,
    "critical": 3,
}


@app.route("/")
def index():
    return jsonify({"status": "ok", "service": "NexaCloud API", "version": "1.1.0"})


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/logs/summary")
def logs_summary():
    return jsonify(LOG_SUMMARY)


@app.route("/logs/critical")
def logs_critical():
    seuil = LOG_SUMMARY["critical"]
    alerte = seuil > 0
    return jsonify({"critical_count": seuil, "alerte": alerte})


@app.route("/logs/error")
def logs_error():
    seuil = LOG_SUMMARY["error"]
    alerte = seuil > 0
    return jsonify({"error_count": seuil, "alerte": alerte})


@app.route("/logs/stats")
def logs_stats():
    total = sum(LOG_SUMMARY.values())
    return jsonify({"total": total, "breakdown": LOG_SUMMARY})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
