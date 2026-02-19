#!/bin/zsh
# Source common profiles to find node
[ -f ~/.zshrc ] && source ~/.zshrc
[ -f ~/.bash_profile ] && source ~/.bash_profile
[ -f ~/.profile ] && source ~/.profile

# Run migration using relative path to salesSuiteNode file
node scripts/run-migration.js ../salesSuiteNode/src/db/migrations/002_regions.sql
