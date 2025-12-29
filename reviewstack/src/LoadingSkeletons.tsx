/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Box } from '@primer/react';
import React from 'react';
import './LoadingSkeletons.css';

// Base skeleton component with shimmer animation
function SkeletonBase({ width, height, borderRadius = 4 }: { width?: string | number; height?: string | number; borderRadius?: number }) {
  return (
    <Box
      className="skeleton-shimmer"
      width={width}
      height={height}
      borderRadius={borderRadius}
      backgroundColor="neutral.subtle"
    />
  );
}

// PR Header skeleton
export function PullRequestHeaderSkeleton({ height }: { height: number }) {
  return (
    <Box
      height={height}
      borderBottomWidth={1}
      borderBottomStyle="solid"
      borderBottomColor="border.default"
      display="flex"
      flexDirection="column"
      gridGap={2}
      padding={3}
    >
      <Box display="flex" alignItems="center" gridGap={2}>
        <SkeletonBase width={40} height={20} />
        <SkeletonBase width={300} height={20} />
        <SkeletonBase width={120} height={16} />
      </Box>
      <Box display="flex" gridGap={2}>
        <SkeletonBase width={80} height={24} borderRadius={12} />
        <SkeletonBase width={120} height={24} />
        <SkeletonBase width={100} height={24} />
      </Box>
    </Box>
  );
}

// PR content skeleton
export function PullRequestContentSkeleton() {
  return (
    <Box display="flex" flexDirection="column" paddingTop={3} gridGap={3}>
      {/* Reviewers section */}
      <Box>
        <SkeletonBase width={80} height={20} />
        <Box marginTop={2}>
          <SkeletonBase width="100%" height={40} />
        </Box>
      </Box>

      {/* Labels section */}
      <Box>
        <SkeletonBase width={60} height={20} />
        <Box marginTop={2}>
          <SkeletonBase width="100%" height={40} />
        </Box>
      </Box>

      {/* Description box */}
      <Box
        borderWidth={1}
        borderStyle="solid"
        borderColor="accent.muted"
        borderRadius={4}
        padding={3}
      >
        <SkeletonBase width="100%" height={20} />
        <Box marginTop={2}>
          <SkeletonBase width="80%" height={20} />
        </Box>
        <Box marginTop={2}>
          <SkeletonBase width="60%" height={20} />
        </Box>
      </Box>

      {/* Signals section */}
      <Box>
        <SkeletonBase width="100%" height={80} />
      </Box>

      {/* Changes count */}
      <Box display="flex" flexDirection="row" gridGap={2} paddingBottom={2}>
        <SkeletonBase width={60} height={20} />
        <SkeletonBase width={60} height={20} />
      </Box>
    </Box>
  );
}

// Diff view skeleton
export function DiffViewSkeleton({ fileCount = 3 }: { fileCount?: number }) {
  return (
    <Box>
      {Array.from({ length: fileCount }, (_, i) => (
        <Box key={i} paddingY={1}>
          <DiffFileSkeleton />
        </Box>
      ))}
    </Box>
  );
}

// Single diff file skeleton
export function DiffFileSkeleton() {
  return (
    <Box>
      {/* File header */}
      <Box
        padding={2}
        backgroundColor="canvas.subtle"
        borderTopWidth={1}
        borderTopStyle="solid"
        borderTopColor="border.default"
        borderBottomWidth={1}
        borderBottomStyle="solid"
        borderBottomColor="border.default"
      >
        <Box display="flex" alignItems="center" gridGap={2}>
          <SkeletonBase width={200} height={16} />
          <SkeletonBase width={60} height={16} />
          <SkeletonBase width={60} height={16} />
        </Box>
      </Box>

      {/* File content lines */}
      <Box>
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} display="flex" padding={1}>
            <SkeletonBase width={40} height={16} />
            <Box marginLeft={2} width="100%">
              <SkeletonBase width={`${Math.random() * 40 + 60}%`} height={16} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Timeline skeleton
export function TimelineSkeleton() {
  return (
    <Box padding={3}>
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} marginBottom={3}>
          <Box display="flex" alignItems="center" gridGap={2} marginBottom={2}>
            <SkeletonBase width={32} height={32} borderRadius={16} />
            <SkeletonBase width={120} height={16} />
            <SkeletonBase width={80} height={14} />
          </Box>
          <Box marginLeft={6}>
            <SkeletonBase width="100%" height={60} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Check suite skeleton
export function ChecksSkeleton() {
  return (
    <Box>
      <Box display="flex" alignItems="center" gridGap={2} marginBottom={2}>
        <SkeletonBase width={60} height={20} />
        <SkeletonBase width={150} height={16} />
      </Box>
      {Array.from({ length: 3 }, (_, i) => (
        <Box key={i} display="flex" alignItems="center" gridGap={2} marginBottom={1}>
          <SkeletonBase width={16} height={16} borderRadius={8} />
          <SkeletonBase width={180} height={16} />
          <SkeletonBase width={80} height={16} />
          <SkeletonBase width={100} height={16} />
        </Box>
      ))}
    </Box>
  );
}