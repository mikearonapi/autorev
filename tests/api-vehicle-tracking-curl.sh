#!/bin/bash

# =============================================================================
# Vehicle Tracking API - cURL Test Commands
# =============================================================================
#
# Usage:
# 1. Set environment variables:
#    export API_URL="http://localhost:3000"
#    export USER_ID="your-user-id"
#    export VEHICLE_ID="your-vehicle-id"
#    export AUTH_TOKEN="your-jwt-token"
#
# 2. Run specific test:
#    bash tests/api-vehicle-tracking-curl.sh test_maintenance_update
#
# 3. Or source this file and call functions:
#    source tests/api-vehicle-tracking-curl.sh
#    test_oil_change
#
# =============================================================================

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
USER_ID="${USER_ID:-test-user-id}"
VEHICLE_ID="${VEHICLE_ID:-test-vehicle-id}"
AUTH_TOKEN="${AUTH_TOKEN:-test-token}"

ENDPOINT="${API_URL}/api/users/${USER_ID}/vehicles/${VEHICLE_ID}"

# =============================================================================
# Helper Functions
# =============================================================================

function print_header() {
  echo ""
  echo "========================================================================"
  echo "$1"
  echo "========================================================================"
}

function print_request() {
  echo ""
  echo "Request:"
  echo "$1"
  echo ""
}

function make_request() {
  local data="$1"
  print_request "$data"
  
  curl -X PATCH "${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "$data" \
    -w "\n\nHTTP Status: %{http_code}\n" \
    -s | jq '.'
}

# =============================================================================
# Example 1: Update Maintenance Tracking Fields
# =============================================================================

function test_maintenance_update() {
  print_header "Example 1: Update Maintenance Tracking Fields"
  
  make_request '{
    "mileage": 45000,
    "last_started_at": "2024-12-28T10:30:00Z",
    "battery_status": "good",
    "last_oil_change_date": "2024-12-15",
    "last_oil_change_mileage": 44500,
    "owner_notes": "Runs great after IMS bearing replacement"
  }'
}

# =============================================================================
# Example 2: Log Oil Change (Auto-Computes Next Due Mileage)
# =============================================================================

function test_oil_change() {
  print_header "Example 2: Log Oil Change"
  
  make_request '{
    "last_oil_change_date": "2024-12-29",
    "last_oil_change_mileage": 50000,
    "mileage": 50000
  }'
  
  echo ""
  echo "Note: next_oil_due_mileage should be auto-computed"
  echo "      (e.g., 50000 + 8000 = 58000 for Porsche)"
}

# =============================================================================
# Example 3: Update Tire Information
# =============================================================================

function test_tire_update() {
  print_header "Example 3: Update Tire Information"
  
  make_request '{
    "tire_installed_date": "2024-11-01",
    "tire_brand_model": "Michelin Pilot Sport 4S",
    "tire_tread_32nds": 10
  }'
  
  echo ""
  echo "Note: 10/32nds ≈ 7.5mm (new tires)"
  echo "      Replace at 2-3/32nds ≈ 1.5-2mm"
}

# =============================================================================
# Example 4: Update Battery Status
# =============================================================================

function test_battery_update() {
  print_header "Example 4: Update Battery Status"
  
  make_request '{
    "battery_status": "fair",
    "battery_installed_date": "2023-06-15",
    "last_started_at": "2024-12-28T14:00:00Z"
  }'
  
  echo ""
  echo "Valid battery_status values: good, fair, weak, dead, unknown"
}

# =============================================================================
# Example 5: Mark Vehicle as in Storage Mode
# =============================================================================

function test_storage_mode() {
  print_header "Example 5: Mark Vehicle as in Storage Mode"
  
  make_request '{
    "storage_mode": true,
    "owner_notes": "Stored for winter. On trickle charger."
  }'
}

# =============================================================================
# Example 6: Update Inspection/Registration Dates
# =============================================================================

function test_inspection_registration() {
  print_header "Example 6: Update Inspection/Registration Dates"
  
  make_request '{
    "last_inspection_date": "2024-10-15",
    "inspection_due_date": "2025-10-15",
    "registration_due_date": "2025-05-01"
  }'
}

# =============================================================================
# Example 7: Update Basic Vehicle Info
# =============================================================================

function test_basic_info() {
  print_header "Example 7: Update Basic Vehicle Info"
  
  make_request '{
    "nickname": "GT4 Beast",
    "color": "Carmine Red",
    "is_primary": true
  }'
}

# =============================================================================
# Error Example 1: Invalid battery_status
# =============================================================================

function test_error_invalid_battery_status() {
  print_header "Error Example 1: Invalid battery_status"
  
  make_request '{
    "battery_status": "excellent"
  }'
  
  echo ""
  echo "Expected: 400 Bad Request with allowed values"
}

# =============================================================================
# Error Example 2: No Fields Provided
# =============================================================================

function test_error_no_fields() {
  print_header "Error Example 2: No Fields Provided"
  
  make_request '{}'
  
  echo ""
  echo "Expected: 400 Bad Request - No update fields provided"
}

# =============================================================================
# Error Example 3: Unauthorized (No Token)
# =============================================================================

function test_error_unauthorized() {
  print_header "Error Example 3: Unauthorized (No Token)"
  
  echo ""
  echo "Request: (no Authorization header)"
  echo ""
  
  curl -X PATCH "${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d '{"mileage": 45000}' \
    -w "\n\nHTTP Status: %{http_code}\n" \
    -s | jq '.'
  
  echo ""
  echo "Expected: 401 Unauthorized"
}

# =============================================================================
# GET Request: Fetch Vehicle Details
# =============================================================================

function test_get_vehicle() {
  print_header "GET Vehicle Details"
  
  echo ""
  echo "Request: GET ${ENDPOINT}"
  echo ""
  
  curl -X GET "${ENDPOINT}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -w "\n\nHTTP Status: %{http_code}\n" \
    -s | jq '.'
}

# =============================================================================
# DELETE Request: Remove Vehicle
# =============================================================================

function test_delete_vehicle() {
  print_header "DELETE Vehicle (DESTRUCTIVE)"
  
  echo ""
  echo "WARNING: This will DELETE the vehicle!"
  echo "Press Ctrl+C to cancel or Enter to continue..."
  read
  
  echo ""
  echo "Request: DELETE ${ENDPOINT}"
  echo ""
  
  curl -X DELETE "${ENDPOINT}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -w "\n\nHTTP Status: %{http_code}\n" \
    -s | jq '.'
}

# =============================================================================
# Integration Test: Complete Maintenance Workflow
# =============================================================================

function test_workflow() {
  print_header "Integration Test: Complete Maintenance Workflow"
  
  echo ""
  echo "This will run a series of updates simulating real-world usage"
  echo ""
  
  # Step 1: Log initial mileage
  print_header "Step 1: Log initial mileage"
  make_request '{
    "mileage": 42000,
    "owner_notes": "Just purchased, fresh from PPI"
  }'
  sleep 1
  
  # Step 2: Log first oil change
  print_header "Step 2: Log first oil change"
  make_request '{
    "last_oil_change_date": "2024-12-01",
    "last_oil_change_mileage": 42100,
    "mileage": 42100
  }'
  sleep 1
  
  # Step 3: Update battery status
  print_header "Step 3: Update battery status after load test"
  make_request '{
    "battery_status": "good",
    "last_started_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
  sleep 1
  
  # Step 4: Log mileage after driving
  print_header "Step 4: Log mileage after weekend drive"
  make_request '{
    "mileage": 42350,
    "last_started_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
  sleep 1
  
  # Step 5: Mark as stored for winter
  print_header "Step 5: Put vehicle in storage mode"
  make_request '{
    "storage_mode": true,
    "owner_notes": "Stored for winter. Battery on trickle charger. Full tank + fuel stabilizer."
  }'
  
  echo ""
  print_header "Workflow Complete!"
  echo "Check the responses above for computed values like next_oil_due_mileage"
}

# =============================================================================
# Run All Examples
# =============================================================================

function run_all_examples() {
  test_maintenance_update
  sleep 2
  test_oil_change
  sleep 2
  test_tire_update
  sleep 2
  test_battery_update
  sleep 2
  test_storage_mode
  sleep 2
  test_inspection_registration
  sleep 2
  test_basic_info
  
  echo ""
  print_header "All Examples Complete!"
}

# =============================================================================
# Run All Error Examples
# =============================================================================

function run_all_errors() {
  test_error_invalid_battery_status
  sleep 2
  test_error_no_fields
  sleep 2
  test_error_unauthorized
  
  echo ""
  print_header "All Error Examples Complete!"
}

# =============================================================================
# Show Menu
# =============================================================================

function show_menu() {
  echo ""
  echo "=============================================================================";
  echo "Vehicle Tracking API - cURL Test Commands"
  echo "=============================================================================";
  echo ""
  echo "Configuration:"
  echo "  API_URL:     ${API_URL}"
  echo "  USER_ID:     ${USER_ID}"
  echo "  VEHICLE_ID:  ${VEHICLE_ID}"
  echo "  AUTH_TOKEN:  ${AUTH_TOKEN:0:20}..."
  echo ""
  echo "Available Functions:"
  echo ""
  echo "Examples:"
  echo "  test_maintenance_update          Example 1: Update maintenance fields"
  echo "  test_oil_change                  Example 2: Log oil change"
  echo "  test_tire_update                 Example 3: Update tire info"
  echo "  test_battery_update              Example 4: Update battery status"
  echo "  test_storage_mode                Example 5: Storage mode"
  echo "  test_inspection_registration     Example 6: Inspection/registration"
  echo "  test_basic_info                  Example 7: Basic info update"
  echo ""
  echo "Error Examples:"
  echo "  test_error_invalid_battery_status    Invalid enum value"
  echo "  test_error_no_fields                 Empty request"
  echo "  test_error_unauthorized              No auth token"
  echo ""
  echo "Other Endpoints:"
  echo "  test_get_vehicle                 GET vehicle details"
  echo "  test_delete_vehicle              DELETE vehicle (destructive)"
  echo ""
  echo "Batch Tests:"
  echo "  run_all_examples                 Run all 7 examples"
  echo "  run_all_errors                   Run all error examples"
  echo "  test_workflow                    Integration test workflow"
  echo ""
  echo "=============================================================================";
  echo ""
  echo "Usage:"
  echo "  1. Set environment variables (see top of file)"
  echo "  2. Source this file:  source tests/api-vehicle-tracking-curl.sh"
  echo "  3. Call a function:   test_oil_change"
  echo ""
  echo "Or run directly:"
  echo "  bash tests/api-vehicle-tracking-curl.sh test_oil_change"
  echo ""
  echo "=============================================================================";
}

# =============================================================================
# Main Execution
# =============================================================================

# If script is run with argument, execute that function
if [ $# -gt 0 ]; then
  if declare -f "$1" > /dev/null; then
    "$1"
  else
    echo "Error: Function '$1' not found"
    show_menu
    exit 1
  fi
else
  show_menu
fi




