import os
import time

import psutil
from prometheus_client import CollectorRegistry, Gauge, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST
from prometheus_client import start_http_server
from http.server import BaseHTTPRequestHandler, HTTPServer


PORT = int(os.getenv("METRICS_AGENT_PORT", "9100"))
SCRAPE_INTERVAL_SECONDS = int(os.getenv("SCRAPE_INTERVAL_SECONDS", "5"))


registry = CollectorRegistry()

cpu_usage_gauge = Gauge(
    "metrics_agent_cpu_usage_percent",
    "CPU usage percentage",
    registry=registry,
)
memory_usage_gauge = Gauge(
    "metrics_agent_memory_usage_percent",
    "Memory usage percentage",
    registry=registry,
)
disk_usage_gauge = Gauge(
    "metrics_agent_disk_usage_percent",
    "Disk usage percentage for root filesystem",
    registry=registry,
)


class MetricsRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/metrics":
            output = generate_latest(registry)
            self.send_response(200)
            self.send_header("Content-Type", CONTENT_TYPE_LATEST)
            self.send_header("Content-Length", str(len(output)))
            self.end_headers()
            self.wfile.write(output)
        else:
            self.send_response(404)
            self.end_headers()


def collect_metrics_loop():
    while True:
        cpu_usage_gauge.set(psutil.cpu_percent())
        memory_usage_gauge.set(psutil.virtual_memory().percent)
        disk_usage_gauge.set(psutil.disk_usage("/").percent)
        time.sleep(SCRAPE_INTERVAL_SECONDS)


def main():
    # Start HTTP server for Prometheus to scrape
    start_http_server(PORT, registry=registry)

    # Start metrics collection loop
    collect_metrics_loop()


if __name__ == "__main__":
    main()

