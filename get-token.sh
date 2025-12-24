#!/bin/bash

# Helper script for Claude to get the GitHub token for ReviewStack testing
# Usage: ./get-token.sh

TOKEN_FILE=".github-token"

if [ -f "$TOKEN_FILE" ]; then
    echo "GitHub Token for ReviewStack development:"
    cat "$TOKEN_FILE"
    echo ""
    echo "Use this token in the ReviewStack login form at http://localhost:3000"
else
    echo "Error: $TOKEN_FILE not found"
    echo "Please check CLAUDE.md for setup instructions"
    exit 1
fi