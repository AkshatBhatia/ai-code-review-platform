/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PullRequestCommentInput from './PullRequestCommentInput';
import {DiffSide, PullRequestReviewCommentState, PullRequestReviewState} from './generated/graphql';
import {
  gitHubClient,
  gitHubPullRequest,
  gitHubPullRequestComparableVersions,
  gitHubPullRequestNewCommentInputCell,
  gitHubPullRequestPositionForLine,
} from './recoil';
import {timelineScrollToBottom} from './PullRequestLayout';
import {gitHubUsername} from './github/gitHubCredentials';
import useRefreshPullRequest from './useRefreshPullRequest';
import {Box, Text} from '@primer/react';
import {useRecoilCallback, useResetRecoilState} from 'recoil';
import type {PullRequestReviewCommentFragment} from './generated/graphql';
import type {PullRequest} from './github/pullRequestTimelineTypes';

/**
 * Updates an optimistic comment with server data in place, preserving the visual state
 * while replacing temporary IDs and data with authoritative server information.
 */
function updateOptimisticCommentWithServerData(
  pullRequest: PullRequest,
  optimisticCommentId: string,
  serverComment: PullRequestReviewCommentFragment
): PullRequest {
  // Create a deep copy to avoid mutating the original
  const updatedPullRequest = {...pullRequest};
  
  // Update the comment in reviewThreads
  if (updatedPullRequest.reviewThreads?.nodes) {
    updatedPullRequest.reviewThreads = {
      ...updatedPullRequest.reviewThreads,
      nodes: updatedPullRequest.reviewThreads.nodes.map(thread => {
        if (thread?.comments?.nodes) {
          const hasOptimisticComment = thread.comments.nodes.some(
            comment => comment?.id === optimisticCommentId
          );
          
          if (hasOptimisticComment) {
            return {
              ...thread,
              comments: {
                ...thread.comments,
                nodes: thread.comments.nodes.map(comment => {
                  if (comment?.id === optimisticCommentId) {
                    // Replace optimistic comment with server data
                    return serverComment;
                  }
                  return comment;
                }),
              },
            };
          }
        }
        return thread;
      }),
    };
  }
  
  // Update the comment in timeline items
  if (updatedPullRequest.timelineItems?.nodes) {
    updatedPullRequest.timelineItems = {
      ...updatedPullRequest.timelineItems,
      nodes: updatedPullRequest.timelineItems.nodes.map(item => {
        if (item?.__typename === 'PullRequestReview' && item.comments?.nodes) {
          const hasOptimisticComment = item.comments.nodes.some(
            comment => comment?.id === optimisticCommentId
          );
          
          if (hasOptimisticComment) {
            return {
              ...item,
              comments: {
                ...item.comments,
                nodes: item.comments.nodes.map(comment => {
                  if (comment?.id === optimisticCommentId) {
                    // Replace optimistic comment with server data
                    return serverComment;
                  }
                  return comment;
                }),
              },
            };
          }
        }
        return item;
      }),
    };
  }
  
  return updatedPullRequest;
}

type Props = {
  line: number;
  path: string;
  side: DiffSide;
};

export default function PullRequestNewCommentInput({line, path, side}: Props): React.ReactElement {
  const onCancel = useResetRecoilState(gitHubPullRequestNewCommentInputCell);
  const refreshPullRequest = useRefreshPullRequest();
  const addComment = useRecoilCallback<[string], Promise<void>>(
    ({snapshot, set}) =>
      async comment => {
        const client = snapshot.getLoadable(gitHubClient).valueMaybe();
        if (client == null) {
          return Promise.reject('client not found');
        }

        const pullRequest = snapshot.getLoadable(gitHubPullRequest).valueMaybe();
        if (pullRequest == null) {
          return Promise.reject('pull request not found');
        }

        const comparableVersions = snapshot
          .getLoadable(gitHubPullRequestComparableVersions)
          .valueMaybe();
        if (comparableVersions == null) {
          return Promise.reject('comparableVersions not found');
        }

        const {beforeCommitID, afterCommitID} = comparableVersions;
        const commitID =
          beforeCommitID != null && side === DiffSide.Left ? beforeCommitID : afterCommitID;

        const position = snapshot
          .getLoadable(gitHubPullRequestPositionForLine({line, path, side}))
          .valueMaybe();
        if (position == null) {
          return Promise.reject('positionForLine not found');
        }

        const usernameLoadable = snapshot.getLoadable(gitHubUsername);
        const username = usernameLoadable.state === 'hasValue' ? usernameLoadable.contents : 'unknown';

        // Create optimistic comment for UI
        const optimisticCommentId = `temp_${Date.now()}`;
        const optimisticComment = {
          __typename: 'PullRequestReviewComment' as const,
          id: optimisticCommentId,
          author: {
            __typename: 'User' as const,
            id: `temp_user_${Date.now()}`,
            login: username || 'unknown',
            avatarUrl: `https://github.com/${username || 'unknown'}.png`,
          },
          originalCommit: {
            __typename: 'Commit' as const,
            oid: commitID,
          },
          path,
          state: PullRequestReviewCommentState.Submitted,
          outdated: false,
          originalPosition: position,
          position,
          bodyHTML: `<p>${comment}</p>`,
          replyTo: null,
          commit: {
            __typename: 'Commit' as const,
            oid: commitID,
          },
        };

        // Create optimistic review thread
        const optimisticThread = {
          __typename: 'PullRequestReviewThread' as const,
          id: `temp_thread_${Date.now()}`,
          originalLine: line,
          diffSide: side,
          comments: {
            __typename: 'PullRequestReviewCommentConnection' as const,
            nodes: [optimisticComment],
          },
        };

        // Find existing pending review or create a new one for the timeline
        const existingPendingReview = (pullRequest.timelineItems.nodes ?? []).find(
          item => item?.__typename === 'PullRequestReview' && item.state === PullRequestReviewState.Pending
        );
        
        let timelineItems;
        if (existingPendingReview && existingPendingReview.__typename === 'PullRequestReview') {
          // Add comment to existing pending review
          timelineItems = {
            ...pullRequest.timelineItems,
            nodes: (pullRequest.timelineItems.nodes ?? []).map(item => {
              if (item === existingPendingReview && item.__typename === 'PullRequestReview') {
                return {
                  ...item,
                  comments: {
                    ...item.comments,
                    nodes: [...(item.comments.nodes ?? []), optimisticComment],
                  },
                };
              }
              return item;
            }),
          };
        } else {
          // Create a new pending review timeline item
          const optimisticReviewId = `temp_review_${Date.now()}`;
          const optimisticReview = {
            __typename: 'PullRequestReview' as const,
            id: optimisticReviewId,
            author: {
              __typename: 'User' as const,
              id: `temp_user_${Date.now()}`,
              login: username || 'unknown',
              avatarUrl: `https://github.com/${username || 'unknown'}.png`,
            },
            state: PullRequestReviewState.Pending,
            bodyHTML: '',
            comments: {
              __typename: 'PullRequestReviewCommentConnection' as const,
              nodes: [optimisticComment],
            },
          };
          
          timelineItems = {
            ...pullRequest.timelineItems,
            nodes: [...(pullRequest.timelineItems.nodes ?? []), optimisticReview],
          };
        }

        // Add optimistic comment to UI immediately (both reviewThreads and timeline)
        const updatedPullRequest = {
          ...pullRequest,
          reviewThreads: {
            ...pullRequest.reviewThreads,
            nodes: [...(pullRequest.reviewThreads.nodes ?? []), optimisticThread],
          },
          timelineItems,
        } as PullRequest;
        set(gitHubPullRequest, updatedPullRequest);

        // Trigger scroll to bottom to show the new comment in the right sidebar
        set(timelineScrollToBottom, Date.now());

        // Note that onCancel() will reset gitHubPullRequestNewCommentInputCell
        // to null, which will result in this component being removed from the
        // DOM.
        onCancel();

        try {
          console.log('🚀 Starting API call for inline comment...');
          const result = await client.addPullRequestReviewComment({
            body: comment,
            commitOID: commitID,
            path,
            position,
            pullRequestId: pullRequest.id,
          });

          console.log('✅ API call succeeded, updating with server data...');
          // Extract server comment data from the response
          const serverComment = result.addPullRequestReviewComment?.comment;
          
          if (serverComment) {
            // Extract the real review ID from the server response
            const serverReviewId = serverComment.pullRequestReview?.id;
            
            if (serverReviewId) {
              console.log('✅ Got real review ID from server:', serverReviewId);
              
              // Update both the comment AND the review ID with server data
              let pullRequestWithServerData = updateOptimisticCommentWithServerData(
                updatedPullRequest as PullRequest,
                optimisticCommentId,
                serverComment
              );
              
              // Find and update the optimistic review with the real server review ID
              if (pullRequestWithServerData.timelineItems?.nodes) {
                pullRequestWithServerData = {
                  ...pullRequestWithServerData,
                  timelineItems: {
                    ...pullRequestWithServerData.timelineItems,
                    nodes: pullRequestWithServerData.timelineItems.nodes.map(item => {
                      if (item?.__typename === 'PullRequestReview' && 
                          item.state === PullRequestReviewState.Pending &&
                          item.id.startsWith('temp_review_')) {
                        // Replace temp review ID with real server ID
                        return {
                          ...item,
                          id: serverReviewId,
                        };
                      }
                      return item;
                    }),
                  },
                };
              }
              
              // Update the state with server data - includes real review ID
              set(gitHubPullRequest, pullRequestWithServerData);
              
              // Trigger scroll to ensure the comment is visible
              set(timelineScrollToBottom, Date.now());
              
              console.log('🔄 Updated comment and review with real IDs from server!');
            } else {
              console.warn('⚠️ Server response missing review ID');
            }
          } else {
            console.warn('⚠️ Server response missing comment data, keeping optimistic comment');
          }
        } catch (error) {
          // Rollback optimistic update on failure
          console.log('❌ API call failed, rolling back optimistic comment...');
          set(gitHubPullRequest, pullRequest);
          throw error;
        }
      },
    [line, onCancel, path, side, refreshPullRequest],
  );

  return (
    <Box backgroundColor="canvas.subtle" fontFamily="normal" padding={2}>
      <Box borderColor="border.default" borderWidth={1} borderStyle="solid">
        <Box padding={2}>
          <Text>
            Commenting on <Text fontWeight="bold">line {line}</Text>
          </Text>
        </Box>
        {/* Do not reset input after adding a comment because addComment unmounts it. */}
        <PullRequestCommentInput
          addComment={addComment}
          onCancel={onCancel}
          autoFocus={true}
          resetInputAfterAddingComment={false}
        />
      </Box>
    </Box>
  );
}
