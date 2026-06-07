#!/bin/bash
echo "Starting GeoGebra Local Server..."
echo ""
echo "Server will run at: http://localhost:8080"
echo "GeoGebra page: http://localhost:8080/geogebra.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8080
