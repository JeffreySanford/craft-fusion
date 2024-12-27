#!/bin/bash

# Clean npm cache and remove node_modules
echo "Cleaning npm cache..."
npm cache clean --force

echo "Removing node_modules..."
rm -rf node_modules

echo "Clean completed."
