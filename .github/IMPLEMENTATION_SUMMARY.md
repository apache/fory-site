# Duplicate Detection Implementation Summary

## ✅ Implementation Complete

This document summarizes the automated duplicate issue and PR detection system that has been implemented in this repository.

## 📁 Files Created

### 1. GitHub Actions Workflow
**File**: `.github/workflows/duplicate-detector.yml`
- Triggers on new issues and PRs (opened/reopened)
- Installs Python dependencies automatically
- Runs duplicate detection script
- Requires permissions: issues:write, pull-requests:write, contents:read

### 2. Detection Script
**File**: `.github/scripts/detect-duplicates.py`
- ~400 lines of Python code
- Uses TF-IDF vectorization and cosine similarity
- Preprocesses text (removes URLs, markdown, special chars)
- Compares against up to 200 historical issues/PRs
- Adds labels and comments automatically
- Optional auto-close for exact matches

### 3. Configuration File
**File**: `.github/duplicate-detector-config.yml`
- Customizable similarity thresholds
- Label names configuration
- Exclude labels list
- Auto-close toggle (disabled by default)
- Processing limits

### 4. Python Dependencies
**File**: `.github/scripts/requirements.txt`
- PyGithub (GitHub API)
- scikit-learn (ML algorithms)
- numpy (numerical operations)
- PyYAML (config parsing)
- requests (HTTP client)

### 5. Documentation
**Files**:
- `.github/DUPLICATE_DETECTION.md` - Comprehensive documentation
- `.github/scripts/README.md` - Scripts documentation
- `CONTRIBUTING.md` - Updated with duplicate detection info

## 🚀 How It Works

1. **Trigger**: New issue/PR opened or reopened
2. **Preprocessing**: Extract and clean title + description
3. **Comparison**: Calculate similarity with existing items using:
   - TF-IDF (Term Frequency-Inverse Document Frequency)
   - Cosine similarity
   - N-gram analysis (1-2 word phrases)
4. **Detection**: Flag items above similarity threshold
5. **Action**:
   - Add label (`possible-duplicate` or `duplicate`)
   - Post comment with links to similar issues
   - Optionally close if exact match

## 📊 Key Features

✅ **Intelligent Detection**: ML-based text similarity analysis
✅ **Configurable Thresholds**: Tune sensitivity to your needs
✅ **Helpful Bot Comments**: Links to similar issues with similarity scores
✅ **Automatic Labeling**: Clear visual indicators
✅ **Safe Defaults**: Auto-close disabled by default
✅ **Performance Optimized**: Checks only recent issues
✅ **Error Handling**: Robust error handling and logging

## ⚙️ Configuration

Edit `.github/duplicate-detector-config.yml` to customize:

```yaml
# Default values (recommended starting point)
similarity_threshold: 0.75          # 75% similarity = possible duplicate
high_similarity_threshold: 0.90     # 90% similarity = exact duplicate
max_issues_to_check: 200            # Check last 200 issues
auto_close_exact_match: false       # Don't auto-close (review first)
label_possible_duplicate: "possible-duplicate"
label_exact_duplicate: "duplicate"
exclude_labels: ["wontfix", "invalid", "spam"]
min_text_length: 20
```

## 🎯 Similarity Thresholds Explained

| Similarity | Classification | Action Taken |
|------------|----------------|--------------|
| < 75% | Not a duplicate | No action |
| 75-89% | Possible duplicate | Add `possible-duplicate` label + comment |
| ≥ 90% | Exact duplicate | Add `duplicate` label + comment (+ optional close) |

## 📝 Example Bot Comment

When a duplicate is detected, the bot posts:

```markdown
👋 **Potential Duplicate Detected**

This issue appears to be similar to existing issues:

- #456: Add feature X support (Similarity: 87%)
- #789: Feature X implementation (Similarity: 82%)
- #123: Request for feature X (Similarity: 76%)

---
Please review these issues to see if any address your concern...
```

## 🧪 Testing

To test locally:

```bash
# Install dependencies
cd .github/scripts
pip install -r requirements.txt

# Set environment variables
export GITHUB_TOKEN="your_token"
export REPOSITORY="apache/fory-site"
export ISSUE_NUMBER=123
export ISSUE_TITLE="Test Issue"
export ISSUE_BODY="Test description"

# Run detection
python detect-duplicates.py --type issue
```

## 🔧 Maintenance

### Tuning for Your Repository

**Too many false positives?**
- Increase `similarity_threshold` (e.g., 0.75 → 0.80)

**Missing duplicates?**
- Decrease `similarity_threshold` (e.g., 0.75 → 0.70)

**Workflow too slow?**
- Decrease `max_issues_to_check` (e.g., 200 → 100)

### Monitoring

Check workflow runs in GitHub Actions:
- Go to repository → Actions tab
- Click on "Duplicate Issue and PR Detection" workflow
- Review logs for any errors or warnings

## 📈 Expected Benefits

1. **Reduced Redundancy**: Fewer duplicate discussions
2. **Time Savings**: Maintainers spend less time managing duplicates
3. **Better Organization**: Related issues are linked together
4. **Improved Contribution**: Contributors see existing work sooner
5. **Cleaner Issue Tracker**: Less clutter and confusion

## 🎓 Similar Implementations

This approach is used successfully by:
- Kubernetes
- TensorFlow
- Visual Studio Code
- React
- Many other large open-source projects

## 🛡️ Safety Features

- **Default to Safe**: Auto-close disabled by default
- **Human Review**: Maintainers can review before closing
- **Easy Override**: Contributors can remove labels if incorrect
- **Transparent**: All actions logged in workflow runs
- **Configurable**: Every behavior can be customized

## 📚 Next Steps

1. **Enable the workflow**: Already enabled automatically on next issue/PR
2. **Monitor results**: Check first few detections for accuracy
3. **Tune settings**: Adjust thresholds based on your repository's patterns
4. **Communicate**: Contributors are informed via updated CONTRIBUTING.md
5. **Iterate**: Refine configuration based on feedback

## 🐛 Troubleshooting

### Workflow not triggering?
- Check workflow file syntax in `.github/workflows/duplicate-detector.yml`
- Verify GitHub Actions is enabled for the repository

### Labels not being added?
- Check workflow permissions (needs `issues: write` and `pull-requests: write`)
- Verify GITHUB_TOKEN has appropriate scopes

### Script errors?
- Check workflow logs in Actions tab
- Verify Python dependencies installed correctly
- Test script locally with sample data

## 📞 Support

For issues or questions:
1. Check `.github/DUPLICATE_DETECTION.md` for detailed docs
2. Review workflow logs in Actions tab
3. Test script locally to isolate issues
4. Open an issue with tag `duplicate-detector`

## 📄 License

This duplicate detection system follows the repository's license.

---

**Implementation Date**: February 8, 2026
**Status**: ✅ Ready for Production Use
**Version**: 1.0.0
