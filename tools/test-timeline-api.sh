#!/bin/bash

# Timeline API Testing Script
# This script provides curl commands to test the timeline API endpoints

API_BASE="http://localhost:3000/api/timeline"

echo "=== Timeline API Testing ==="
echo ""

echo "1. Check API Health:"
echo "curl -s http://localhost:3000/api/health"
echo ""

echo "2. Get all timeline events:"
echo "curl -s $API_BASE | jq ."
echo ""

echo "3. Add a Ray Sanford event:"
echo "curl -X POST $API_BASE \\
  -H 'Content-Type: application/json' \\
  -d '{
    \"title\": \"Ray Sanford Historical Event\",
    \"description\": \"A significant historical event in Ray Sandford life\",
    \"date\": \"2024-01-15T10:00:00Z\",
    \"type\": \"historical\"
  }'"
echo ""

echo "4. Add a Jeffrey Professional event:"
echo "curl -X POST $API_BASE \\
  -H 'Content-Type: application/json' \\
  -d '{
    \"title\": \"Jeffrey Professional Achievement\",
    \"description\": \"A professional milestone in Jeffrey career\",
    \"date\": \"2024-01-20T14:30:00Z\",
    \"type\": \"historical\"
  }'"
echo ""

echo "5. Add a Jeffrey Technical event:"
echo "curl -X POST $API_BASE \\
  -H 'Content-Type: application/json' \\
  -d '{
    \"title\": \"Developer Journal Entry\",
    \"description\": \"Technical insights and learnings from development work\",
    \"date\": \"2024-01-25T09:15:00Z\",
    \"type\": \"personal\"
  }'"
echo ""

echo "6. Get events by type (historical):"
echo "curl -s \"$API_BASE?type=historical\" | jq ."
echo ""

echo "7. Get events by type (personal):"
echo "curl -s \"$API_BASE?type=personal\" | jq ."
echo ""

echo "8. Get specific event by ID (replace EVENT_ID):"
echo "curl -s $API_BASE/EVENT_ID | jq ."
echo ""

echo "9. Update an event (replace EVENT_ID):"
echo "curl -X PUT $API_BASE/EVENT_ID \\
  -H 'Content-Type: application/json' \\
  -d '{
    \"title\": \"Updated Event Title\",
    \"description\": \"Updated description\",
    \"date\": \"2024-01-30T16:00:00Z\",
    \"type\": \"historical\"
  }'"
echo ""

echo "10. Delete an event (replace EVENT_ID):"
echo "curl -X DELETE $API_BASE/EVENT_ID"
echo ""

echo "=== Quick Test Commands ==="
echo ""
echo "# Test all endpoints:"
echo "curl -s http://localhost:3000/api/health && echo \"\" && curl -s $API_BASE | jq '. | length' && echo \" events found\""
echo ""
echo "# Add test data:"
echo "curl -X POST $API_BASE -H 'Content-Type: application/json' -d '{\"title\":\"Test Event\",\"description\":\"Test\",\"date\":\"2024-01-01T00:00:00Z\",\"type\":\"historical\"}' && echo \"\""
echo ""
echo "# Verify data:"
echo "curl -s $API_BASE | jq '.[].title'"
echo ""