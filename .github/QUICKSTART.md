# Quick Start Guide - Duplicate Detection

## 🚀 Getting Started in 5 Minutes

### Step 1: Verify Installation ✅
All files have been installed. Verify they exist:
- `.github/workflows/duplicate-detector.yml` - Main workflow
- `.github/scripts/detect-duplicates.py` - Detection script
- `.github/duplicate-detector-config.yml` - Configuration
- `.github/scripts/requirements.txt` - Python dependencies

### Step 2: Understand Default Behavior
The system is configured with safe defaults:
- ✅ **ENABLED**: Automatic detection for new issues/PRs
- ✅ **ENABLED**: Labeling suspected duplicates
- ✅ **ENABLED**: Bot comments with similar issues
- ❌ **DISABLED**: Auto-closing duplicates (requires manual review)

### Step 3: Test It Out
The workflow will automatically run when:
- A new issue is opened or reopened
- A new PR is opened or reopened

**Manual test**: Create a test issue and see the bot in action!

### Step 4: Monitor First Results
1. Go to repository → **Actions** tab
2. Look for "Duplicate Issue and PR Detection" workflow
3. Click on a run to see logs and results

### Step 5: Tune Settings (Optional)
Edit [.github/duplicate-detector-config.yml](.github/duplicate-detector-config.yml):

```yaml
# Adjust sensitivity (lower = more matches)
similarity_threshold: 0.75

# Enable auto-close for exact matches (optional)
auto_close_exact_match: false  # Change to true to enable
```

## 🎯 Common Adjustments

### Too Many False Positives
```yaml
# Increase threshold (more strict)
similarity_threshold: 0.80
high_similarity_threshold: 0.92
```

### Missing Duplicates
```yaml
# Decrease threshold (more sensitive)
similarity_threshold: 0.70
high_similarity_threshold: 0.85
```

### Improve Performance
```yaml
# Check fewer historical issues
max_issues_to_check: 100
```

## 📊 What to Expect

### When a Duplicate is Detected:

1. **Label Added**: `possible-duplicate` or `duplicate`
2. **Bot Comment**: Links to similar issues with similarity scores
3. **No Auto-Close**: By default, requires manual review

### Example Bot Comment:
```
👋 Potential Duplicate Detected

This issue appears to be similar to existing issues:
- #123: Feature request X (Similarity: 87%)
- #456: Add support for X (Similarity: 82%)

Please review these issues...
```

## 🔧 Troubleshooting

### Issue: Workflow not running
**Solution**: Check that GitHub Actions is enabled in repository settings

### Issue: Label not added
**Solution**: Verify workflow has `issues: write` permission

### Issue: Too many/few detections
**Solution**: Adjust `similarity_threshold` in config file

## 📚 Need More Help?

- **Full Documentation**: [DUPLICATE_DETECTION.md](DUPLICATE_DETECTION.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Script Documentation**: [scripts/README.md](scripts/README.md)
- **Contributor Guide**: [../CONTRIBUTING.md](../CONTRIBUTING.md)

## ✨ That's It!

The system is now active and will automatically detect duplicates. No further action required!

---

**Quick Test**: Create a test issue with title "Test duplicate detection" to see it in action.
