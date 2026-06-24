#!/usr/bin/env python3
"""
Duplicate Issue and Pull Request Detection Script
Detects potential duplicate issues and PRs using text similarity analysis.
"""

import os
import sys
import argparse
from typing import List, Tuple
from github import Github, GithubException
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import yaml

# Configuration defaults
DEFAULT_SIMILARITY_THRESHOLD = 0.75
DEFAULT_HIGH_SIMILARITY_THRESHOLD = 0.90
DEFAULT_MAX_ISSUES_TO_CHECK = 200
DEFAULT_AUTO_CLOSE_EXACT_MATCH = False
DEFAULT_LABEL_POSSIBLE_DUPLICATE = "possible-duplicate"
DEFAULT_LABEL_EXACT_DUPLICATE = "duplicate"
DEFAULT_MAX_SIMILAR_TO_SHOW = 5


class DuplicateDetector:
    """Detects duplicate issues and pull requests."""
    
    def __init__(self, token: str, repo_name: str, config_path: str = None):
        try:
            self.github = Github(token)
            self.repo = self.github.get_repo(repo_name)
            self.config = self.load_config(config_path)
        except Exception as e:
            print(f"Error initializing GitHub connection: {e}")
            sys.exit(1)
        
    def load_config(self, config_path: str = None) -> dict:
        """Load configuration from YAML file or use defaults."""
        default_config = {
            'similarity_threshold': DEFAULT_SIMILARITY_THRESHOLD,
            'high_similarity_threshold': DEFAULT_HIGH_SIMILARITY_THRESHOLD,
            'max_issues_to_check': DEFAULT_MAX_ISSUES_TO_CHECK,
            'auto_close_exact_match': DEFAULT_AUTO_CLOSE_EXACT_MATCH,
            'label_possible_duplicate': DEFAULT_LABEL_POSSIBLE_DUPLICATE,
            'label_exact_duplicate': DEFAULT_LABEL_EXACT_DUPLICATE,
            'exclude_labels': ['wontfix', 'invalid'],
            'min_text_length': 20,
            'max_similar_to_show': DEFAULT_MAX_SIMILAR_TO_SHOW,
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = yaml.safe_load(f)
                    if user_config is None:
                        user_config = {}
                    elif not isinstance(user_config, dict):
                        raise ValueError("Config file must contain a mapping at the top level")
                    default_config.update(user_config)
            except Exception as e:
                print(f"Warning: Could not load config file: {e}")
        
        return default_config
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess text for comparison."""
        if not text:
            return ""
        # Convert to lowercase and strip whitespace
        text = text.lower().strip()
        # Remove URLs
        import re
        text = re.sub(r'http\S+|www.\S+', '', text)
        # Remove markdown code blocks
        text = re.sub(r'```[\s\S]*?```', '', text)
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
    
    def find_similar_issues(self, current_number: int, current_title: str, 
                           current_body: str, item_type: str = 'issue') -> List[Tuple[int, str, float]]:
        """Find similar issues or PRs."""
        current_text = self.preprocess_text(f"{current_title} {current_body}")
        
        if len(current_text) < self.config['min_text_length']:
            print(f"Text too short for meaningful comparison: {len(current_text)} chars")
            return []
        
        # Get existing items to compare against
        if item_type == 'issue':
            items = self.repo.get_issues(state='all')
        else:
            items = self.repo.get_pulls(state='all')
        
        # First pass: collect all candidate items and their texts
        candidates = []  # List of (item_number, item_title, item_text)
        checked_count = 0
        
        try:
            for item in items:
                if checked_count >= self.config['max_issues_to_check']:
                    break
                
                # Skip the current item
                if item.number == current_number:
                    continue
                
                # Skip pull requests when checking issues (PRs are returned by get_issues API)
                if item_type == 'issue' and hasattr(item, 'pull_request') and item.pull_request:
                    continue
                
                try:
                    # Skip items with excluded labels
                    item_labels = [label.name for label in item.labels]
                    if any(label in self.config['exclude_labels'] for label in item_labels):
                        continue
                    
                    # Preprocess and store candidate text
                    item_text = self.preprocess_text(f"{item.title} {item.body or ''}")
                    if item_text:  # Only include non-empty texts
                        candidates.append((item.number, item.title, item_text))
                except Exception as e:
                    print(f"Warning: Error processing item #{item.number}: {e}")
                    continue
                finally:
                    checked_count += 1
        except Exception as e:
            print(f"Error fetching items from repository: {e}")
            print("This might be due to API rate limits or permissions issues.")
            return []
        
        if not candidates:
            return []
        
        # Second pass: calculate all similarities at once
        try:
            # Build corpus: current text + all candidate texts
            corpus = [current_text] + [text for _, _, text in candidates]
            
            # Fit vectorizer once on entire corpus
            vectorizer = TfidfVectorizer(
                min_df=1,
                stop_words='english',
                ngram_range=(1, 2)
            )
            tfidf_matrix = vectorizer.fit_transform(corpus)
            
            # Compute similarities between current item (index 0) and all candidates
            similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
            
            # Build results list with items meeting threshold
            similar_items = []
            for i, (num, title, _) in enumerate(candidates):
                similarity = float(similarities[i])
                if similarity >= self.config['similarity_threshold']:
                    similar_items.append((num, title, similarity))
            
        except Exception as e:
            print(f"Error calculating similarities: {e}")
            return []
        
        # Sort by similarity (highest first)
        similar_items.sort(key=lambda x: x[2], reverse=True)
        return similar_items
    
    def add_label(self, item_number: int, label: str, item_type: str = 'issue'):
        """Add a label to an issue or PR."""
        try:
            # Ensure label exists
            try:
                self.repo.get_label(label)
            except GithubException:
                # Create label if it doesn't exist (label not found)
                if label == self.config['label_possible_duplicate']:
                    self.repo.create_label(label, "FFA500", "Potential duplicate issue")
                elif label == self.config['label_exact_duplicate']:
                    self.repo.create_label(label, "FF0000", "Exact duplicate issue")
            
            if item_type == 'issue':
                item = self.repo.get_issue(item_number)
            else:
                item = self.repo.get_pull(item_number)
            
            item.add_to_labels(label)
            print(f"Added label '{label}' to {item_type} #{item_number}")
        except Exception as e:
            print(f"Error adding label: {e}")
    
    def add_comment(self, item_number: int, similar_items: List[Tuple[int, str, float]], 
                   item_type: str = 'issue'):
        """Add a comment about potential duplicates."""
        if not similar_items:
            return
        
        item_type_name = "issue" if item_type == 'issue' else "pull request"
        
        # Build comment message
        comment = f"👋 **Potential Duplicate Detected**\n\n"
        comment += f"This {item_type_name} appears to be similar to existing {item_type_name}s:\n\n"
        
        max_to_show = self.config['max_similar_to_show']
        for number, title, similarity in similar_items[:max_to_show]:
            similarity_pct = int(similarity * 100)
            comment += f"- #{number}: {title} (Similarity: {similarity_pct}%)\n"
        
        comment += f"\n---\n"
        comment += f"Please review these {item_type_name}s to see if any of them address your concern. "
        comment += f"If this is indeed a duplicate, please close this {item_type_name} and continue the discussion in the existing one.\n\n"
        comment += f"If this is **not** a duplicate, please add more context to help differentiate it.\n\n"
        comment += f"*This is an automated message. If you believe this is incorrect, please remove the label and mention a maintainer.*"
        
        try:
            if item_type == 'issue':
                item = self.repo.get_issue(item_number)
            else:
                item = self.repo.get_pull(item_number)
            
            item.create_comment(comment)
            print(f"Added duplicate detection comment to {item_type} #{item_number}")
        except Exception as e:
            print(f"Error adding comment: {e}")
    
    def close_item(self, item_number: int, duplicate_of: int, item_type: str = 'issue'):
        """Close an item as a duplicate."""
        try:
            if item_type == 'issue':
                item = self.repo.get_issue(item_number)
            else:
                item = self.repo.get_pull(item_number)
            
            comment = f"🔒 **Closing as Exact Duplicate**\n\n"
            comment += f"This {item_type} is an exact duplicate of #{duplicate_of}.\n\n"
            comment += f"Please continue the discussion in #{duplicate_of}."
            
            item.create_comment(comment)
            item.edit(state='closed')
            print(f"Closed {item_type} #{item_number} as duplicate of #{duplicate_of}")
        except Exception as e:
            print(f"Error closing item: {e}")
    
    def process_item(self, item_number: int, title: str, body: str, item_type: str = 'issue'):
        """Process an issue or PR for duplicate detection."""
        print(f"\n{'='*60}")
        print(f"Processing {item_type} #{item_number}: {title}")
        print(f"{'='*60}\n")
        
        # Find similar items
        similar_items = self.find_similar_issues(item_number, title, body, item_type)
        
        if not similar_items:
            print(f"✅ No duplicates found for {item_type} #{item_number}")
            return
        
        print(f"\n🔍 Found {len(similar_items)} similar {item_type}(s):")
        for num, ttl, sim in similar_items:
            print(f"  - #{num}: {ttl[:60]}... (Similarity: {sim:.2%})")
        
        # Get the highest similarity
        highest_similarity = similar_items[0][2]
        highest_similar_number = similar_items[0][0]
        
        # Determine action based on similarity
        if highest_similarity >= self.config['high_similarity_threshold']:
            print(f"\n⚠️  High similarity detected ({highest_similarity:.2%})")
            self.add_label(item_number, self.config['label_exact_duplicate'], item_type)
            self.add_comment(item_number, similar_items, item_type)
            
            # Only auto-close issues; PRs should not be auto-closed by this flag
            if item_type == 'issue' and self.config['auto_close_exact_match']:
                self.close_item(item_number, highest_similar_number, item_type)
        else:
            print(f"\n⚠️  Possible duplicate detected ({highest_similarity:.2%})")
            self.add_label(item_number, self.config['label_possible_duplicate'], item_type)
            self.add_comment(item_number, similar_items, item_type)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Detect duplicate issues and PRs')
    parser.add_argument('--type', choices=['issue', 'pr'], required=True,
                       help='Type of item to check (issue or pr)')
    parser.add_argument('--config', default='.github/duplicate-detector-config.yml',
                       help='Path to configuration file')
    args = parser.parse_args()
    
    # Get environment variables
    token = os.getenv('GITHUB_TOKEN')
    repo_name = os.getenv('REPOSITORY')
    
    if not token or not repo_name:
        print("Error: GITHUB_TOKEN and REPOSITORY environment variables are required")
        sys.exit(1)
    
    # Get item details based on type
    if args.type == 'issue':
        item_number = int(os.getenv('ISSUE_NUMBER', 0))
        item_title = os.getenv('ISSUE_TITLE', '').strip()
        item_body = os.getenv('ISSUE_BODY', '').strip()
    else:
        item_number = int(os.getenv('PR_NUMBER', 0))
        item_title = os.getenv('PR_TITLE', '').strip()
        item_body = os.getenv('PR_BODY', '').strip()
    
    if not item_number:
        print(f"Error: {args.type.upper()}_NUMBER not found")
        sys.exit(1)
    
    if not item_title:
        print(f"Warning: {args.type.upper()}_TITLE is empty")
        item_title = f"Untitled {args.type}"
    
    # Create detector and process
    try:
        detector = DuplicateDetector(token, repo_name, args.config)
        detector.process_item(item_number, item_title, item_body, args.type)
        
        print(f"\n{'='*60}")
        print("✅ Duplicate detection completed successfully")
        print(f"{'='*60}\n")
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"❌ Error during duplicate detection: {e}")
        print(f"{'='*60}\n")
        print("\nThis might be due to:")
        print("- GitHub API rate limits")
        print("- Insufficient permissions")
        print("- Network connectivity issues")
        print("- Invalid configuration")
        sys.exit(1)


if __name__ == '__main__':
    main()
