#!/bin/bash

# Run tests
echo "Running tests..."
npx nx test craft-web
npx nx test craft-nest

echo "Tests completed."
