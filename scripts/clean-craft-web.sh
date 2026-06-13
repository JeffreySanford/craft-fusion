#!/bin/bash
# clean-craft-web.sh - Remove build and cache folders for craft-web

set -e

rm -rf apps/craft-web/dist
rm -rf apps/craft-web/.angular
rm -rf apps/craft-web/.output
rm -rf apps/craft-web/.vite

echo "Cleaned craft-web build and cache folders."
