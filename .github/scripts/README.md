# GitHub Automation Scripts

This directory contains automation scripts used by GitHub Actions workflows.

## Available Scripts

### detect-duplicates.py

**Purpose**: Detects duplicate issues and pull requests using machine learning-based text similarity analysis.

**Usage**:
```bash
# For issues
python detect-duplicates.py --type issue

# For pull requests
python detect-duplicates.py --type pr
```

**Environment Variables Required**:
- `GITHUB_TOKEN`: GitHub API token
- `REPOSITORY`: Repository name (format: owner/repo)
- For issues: `ISSUE_NUMBER`, `ISSUE_TITLE`, `ISSUE_BODY`
- For PRs: `PR_NUMBER`, `PR_TITLE`, `PR_BODY`

**Configuration**: Uses `.github/duplicate-detector-config.yml` for settings

**Dependencies**: See `requirements.txt`

### Local Testing

To test the duplicate detection script locally:

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export GITHUB_TOKEN="your_token_here"
export REPOSITORY="apache/fory-site"
export ISSUE_NUMBER=123
export ISSUE_TITLE="Sample Issue Title"
export ISSUE_BODY="Sample issue description..."
```

3. Run the script:
```bash
python detect-duplicates.py --type issue
```

## Adding New Scripts

When adding new automation scripts:

1. Place the script in this directory
2. Add dependencies to `requirements.txt`
3. Document usage in this README
4. Create corresponding workflow in `.github/workflows/`
5. Add error handling and logging
6. Test locally before committing

## Maintenance

- Keep dependencies updated in `requirements.txt`
- Follow Python best practices (PEP 8)
- Add type hints where possible
- Include docstrings for functions
- Handle errors gracefully
- Log important actions

## Support

For issues with automation scripts, check:
1. Workflow logs in GitHub Actions
2. Script output and error messages
3. Configuration file syntax
4. Required permissions and tokens
