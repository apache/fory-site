# Duplicate Issue and PR Detection System

## Overview

This automated system detects potential duplicate issues and pull requests in the repository using advanced text similarity analysis. It helps reduce redundant discussions, repeated work, and maintenance overhead by proactively identifying and flagging similar issues.

## Features

✅ **Automated Detection**: Scans newly created issues and PRs automatically
✅ **Text Similarity Analysis**: Uses TF-IDF vectorization and cosine similarity for accurate matching
✅ **Smart Labeling**: Automatically labels suspected duplicates with configurable labels
✅ **Helpful Comments**: Adds bot comments with links to similar issues
✅ **Configurable Behavior**: Fully customizable thresholds and settings
✅ **Optional Auto-Close**: Can automatically close exact duplicates (disabled by default)
✅ **Efficient Processing**: Checks only recent issues to maintain performance

## How It Works

1. **Trigger**: When a new issue or PR is opened or reopened
2. **Analysis**: The system extracts and preprocesses the title and description
3. **Comparison**: Compares against existing issues/PRs using TF-IDF and cosine similarity
4. **Detection**: Identifies potential duplicates based on similarity thresholds
5. **Action**: Adds labels and comments to flag suspected duplicates

## Configuration

Edit `.github/duplicate-detector-config.yml` to customize behavior:

### Key Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `similarity_threshold` | 0.75 | Minimum similarity (0-1) to flag as possible duplicate |
| `high_similarity_threshold` | 0.90 | Minimum similarity to flag as exact duplicate |
| `max_issues_to_check` | 200 | Maximum number of past issues to compare against |
| `auto_close_exact_match` | false | Automatically close exact duplicates |
| `label_possible_duplicate` | possible-duplicate | Label for possible duplicates |
| `label_exact_duplicate` | duplicate | Label for exact duplicates |
| `exclude_labels` | [wontfix, invalid] | Skip issues with these labels |
| `min_text_length` | 20 | Minimum text length for comparison |

### Example Configuration

```yaml
# Set similarity threshold to 70%
similarity_threshold: 0.70

# Enable auto-closing for exact matches
auto_close_exact_match: true

# Check more historical issues
max_issues_to_check: 500

# Custom labels
label_possible_duplicate: "needs-review-duplicate"
label_exact_duplicate: "confirmed-duplicate"
```

## Workflow File

The workflow is defined in `.github/workflows/duplicate-detector.yml` and runs on:
- New issues (opened, reopened)
- New pull requests (opened, reopened)

## Detection Algorithm

The system uses the following approach:

1. **Text Preprocessing**:
   - Converts to lowercase
   - Removes URLs and markdown code blocks
   - Removes special characters
   - Normalizes whitespace

2. **Feature Extraction**:
   - TF-IDF vectorization with 1-2 word n-grams
   - English stop words removal
   - Term frequency-inverse document frequency scoring

3. **Similarity Calculation**:
   - Cosine similarity between feature vectors
   - Range: 0.0 (completely different) to 1.0 (identical)

4. **Threshold-Based Classification**:
   - Below threshold: No action
   - Above similarity_threshold: Possible duplicate
   - Above high_similarity_threshold: Exact duplicate

## Example Output

When a duplicate is detected, the bot will:

1. **Add a label** (`possible-duplicate` or `duplicate`)

2. **Post a comment** like:

```markdown
👋 **Potential Duplicate Detected**

This issue appears to be similar to existing issues:

- #123: Add support for feature X (Similarity: 87%)
- #456: Implement feature X enhancement (Similarity: 82%)
- #789: Feature request: X functionality (Similarity: 76%)

---
Please review these issues to see if any of them address your concern...
```

3. **Optionally close** the issue (if `auto_close_exact_match: true` and similarity > 90%)

## Permissions

The workflow requires the following permissions:
- `issues: write` - To add labels and comments to issues
- `pull-requests: write` - To add labels and comments to PRs
- `contents: read` - To read configuration files

## Dependencies

Python packages (auto-installed in workflow):
- PyGithub - GitHub API interaction
- scikit-learn - ML-based text similarity
- numpy - Numerical computations
- PyYAML - Configuration parsing
- requests - HTTP requests

## Troubleshooting

### Issue: Labels not being added
- **Solution**: Check repository permissions for GitHub Actions

### Issue: Too many false positives
- **Solution**: Increase `similarity_threshold` in config (e.g., from 0.75 to 0.80)

### Issue: Missing actual duplicates
- **Solution**: Decrease `similarity_threshold` (e.g., from 0.75 to 0.70)

### Issue: Workflow running slowly
- **Solution**: Decrease `max_issues_to_check` (e.g., from 200 to 100)

## Best Practices

1. **Start Conservative**: Keep `auto_close_exact_match: false` initially
2. **Monitor Results**: Review flagged duplicates for accuracy
3. **Tune Thresholds**: Adjust based on your repository's patterns
4. **Update Labels**: Use clear, descriptive label names
5. **Communicate**: Add info about duplicate detection to CONTRIBUTING.md

## Maintenance

### Adding to CONTRIBUTING.md

Add this section to inform contributors:

```markdown
## Duplicate Issues

We use an automated system to detect duplicate issues. If your issue is flagged as a potential duplicate:

1. Review the similar issues linked in the bot comment
2. If it's truly a duplicate, close your issue and comment on the existing one
3. If it's NOT a duplicate, add more details to differentiate it and mention a maintainer
4. Remove the duplicate label if you believe it's incorrect
```

### Regular Reviews

Periodically review:
- Labeled issues to verify accuracy
- Configuration settings for optimal performance
- Logs in workflow runs for errors

## Metrics

Track effectiveness by monitoring:
- Number of duplicates detected
- False positive rate
- Time saved by maintainers
- Contributor feedback

## Similar Implementations

This system is inspired by duplicate detection used in:
- Kubernetes
- TensorFlow
- VS Code
- React

## Support

For issues with the duplicate detector:
1. Check workflow logs in Actions tab
2. Review configuration file syntax
3. Test Python script locally with sample data
4. Open an issue with tag `duplicate-detector`

## License

This duplicate detection system is part of the repository and follows the same license.
