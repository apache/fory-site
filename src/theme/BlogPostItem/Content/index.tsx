/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import clsx from 'clsx';
import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/theme-common/internal';
import MDXContent from '@theme/MDXContent';
import type {Props} from '@theme/BlogPostItem/Content';

export default function BlogPostItemContent({
  children,
  className,
}: Props): JSX.Element {
  const {isBlogPostPage, metadata} = useBlogPost();
  const summary =
    metadata.frontMatter.description?.trim() ?? metadata.description?.trim();

  const containerProps = {
    id: isBlogPostPage ? blogPostContainerID : undefined,
    className: clsx('markdown', className),
    itemProp: 'articleBody' as const,
  };

  if (!isBlogPostPage && summary) {
    return (
      <div {...containerProps}>
        <p>{summary}</p>
      </div>
    );
  }

  return (
    <div {...containerProps}>
      <MDXContent>{children}</MDXContent>
    </div>
  );
}

