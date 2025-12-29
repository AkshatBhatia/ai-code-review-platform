/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PullRequestCommentInput from './PullRequestCommentInput';
import PullRequestReviewSelector from './PullRequestReviewSelector';
import {PullRequestReviewEvent} from './generated/graphql';
import {gitHubClient, gitHubPullRequest, gitHubPullRequestPendingReviewID, gitHubPullRequestHasPendingReview} from './recoil';
import {gitHubUsername} from './github/gitHubCredentials';
import {timelineScrollToBottom} from './PullRequestLayout';
import useRefreshPullRequest from './useRefreshPullRequest';
import {useState} from 'react';
import {useRecoilCallback, useRecoilValue} from 'recoil';
import type {PullRequest} from './github/pullRequestTimelineTypes';

export default function PullRequestTimelineCommentInput(): React.ReactElement {
  const pendingReviewID = useRecoilValue(gitHubPullRequestPendingReviewID);
  const hasPendingReview = useRecoilValue(gitHubPullRequestHasPendingReview);
  const refreshPullRequest = useRefreshPullRequest();
  const [event, setEvent] = useState(PullRequestReviewEvent.Comment);
  const addComment = useRecoilCallback<[string], Promise<void>>(
    ({snapshot, set}) =>
      async comment => {
        const clientLoadable = snapshot.getLoadable(gitHubClient);
        if (clientLoadable.state !== 'hasValue' || clientLoadable.contents == null) {
          return Promise.reject('client not found');
        }
        const client = clientLoadable.contents;

        const pullRequestLoadable = snapshot.getLoadable(gitHubPullRequest);
        if (pullRequestLoadable.state !== 'hasValue' || pullRequestLoadable.contents == null) {
          return Promise.reject('pull request not found');
        }
        const pullRequest = pullRequestLoadable.contents;

        const usernameLoadable = snapshot.getLoadable(gitHubUsername);
        const username = usernameLoadable.state === 'hasValue' ? usernameLoadable.contents : 'unknown';

        // Create optimistic comment for UI
        const optimisticComment = {
          __typename: 'IssueComment' as const,
          id: `temp_${Date.now()}`,
          author: {
            __typename: 'User' as const,
            id: `temp_user_${Date.now()}`,
            login: username || 'unknown',
            avatarUrl: `https://github.com/${username || 'unknown'}.png`,
          },
          bodyHTML: `<p>${comment}</p>`,
          createdAt: new Date().toISOString() as any,
        };

        // Add optimistic comment to UI immediately (only for simple comments)
        if (pendingReviewID == null && event === PullRequestReviewEvent.Comment) {
          const updatedPullRequest = {
            ...pullRequest,
            timelineItems: {
              ...pullRequest.timelineItems,
              nodes: [...(pullRequest.timelineItems.nodes ?? []), optimisticComment],
            },
          };
          set(gitHubPullRequest, updatedPullRequest);
          
          // Trigger scroll to bottom to show the new comment
          set(timelineScrollToBottom, Date.now());
        }

        try {
          console.log('🚀 Starting API call for timeline comment...');
          let result;
          
          // Check if we have any pending reviews (including optimistic ones)
          if (hasPendingReview && pendingReviewID == null) {
            // We have pending reviews but no real server ID yet (optimistic reviews)
            // For now, we'll just create a new comment/review
            console.log('⚠️ Have optimistic pending reviews but no server ID, creating new review...');
            
            if (event === PullRequestReviewEvent.Comment) {
              result = await client.addComment(pullRequest.id, comment);
            } else {
              result = await client.addPullRequestReview({
                body: comment,
                pullRequestId: pullRequest.id,
                event,
              });
            }
          } else if (pendingReviewID != null) {
            // We have a real pending review ID, submit it normally
            console.log('✅ Submitting existing pending review...');
            result = await client.submitPullRequestReview({
              body: comment,
              pullRequestId: pullRequest.id,
              pullRequestReviewId: pendingReviewID,
              event,
            });
          } else {
            // No pending reviews, create new comment/review
            console.log('✅ Creating new comment/review...');
            if (event === PullRequestReviewEvent.Comment) {
              result = await client.addComment(pullRequest.id, comment);
            } else {
              result = await client.addPullRequestReview({
                body: comment,
                pullRequestId: pullRequest.id,
                event,
              });
            }
          }

          console.log('✅ API call succeeded, updating with server data...');
          
          // Update pull request state based on the response
          let updatedPullRequest: PullRequest = pullRequest;
          
          // Handle submitPullRequestReview response
          if (result && 'submitPullRequestReview' in result && result.submitPullRequestReview?.pullRequestReview) {
            const submittedReview = result.submitPullRequestReview.pullRequestReview;
            console.log('📝 Updating submitted review in timeline');
            
            // Replace the pending review with the submitted one
            updatedPullRequest = {
              ...pullRequest,
              timelineItems: {
                ...pullRequest.timelineItems,
                nodes: (pullRequest.timelineItems.nodes ?? []).map(item => {
                  if (item?.__typename === 'PullRequestReview' && item.id === pendingReviewID) {
                    return submittedReview;
                  }
                  return item;
                }),
              },
              // Also update review threads from PENDING to the submitted state
              reviewThreads: {
                ...pullRequest.reviewThreads,
                nodes: (pullRequest.reviewThreads.nodes ?? []).map(thread => {
                  if (!thread) return thread;
                  // Update threads that were part of this pending review
                  const hasCommentFromPendingReview = thread.comments.nodes?.some(
                    comment => comment?.pullRequestReview?.id === pendingReviewID
                  );
                  if (hasCommentFromPendingReview) {
                    return {
                      ...thread,
                      comments: {
                        ...thread.comments,
                        nodes: thread.comments.nodes?.map(comment => {
                          if (!comment) return comment;
                          if (comment.pullRequestReview?.id === pendingReviewID) {
                            return {
                              ...comment,
                              pullRequestReview: submittedReview,
                            };
                          }
                          return comment;
                        }),
                      },
                    };
                  }
                  return thread;
                }),
              },
            };
          }
          // Handle addComment response
          else if (result && 'addComment' in result && result.addComment?.commentEdge?.node) {
            const newComment = result.addComment.commentEdge.node;
            console.log('📝 Adding comment to timeline');
            
            // Replace optimistic comment with real one, or add if no optimistic
            const hasOptimistic = (pullRequest.timelineItems.nodes ?? []).some(
              item => item?.__typename === 'IssueComment' && item.id.startsWith('temp_')
            );
            
            if (hasOptimistic) {
              updatedPullRequest = {
                ...pullRequest,
                timelineItems: {
                  ...pullRequest.timelineItems,
                  nodes: (pullRequest.timelineItems.nodes ?? []).map(item => {
                    if (item?.__typename === 'IssueComment' && item.id.startsWith('temp_')) {
                      return newComment;
                    }
                    return item;
                  }),
                },
              };
            } else {
              updatedPullRequest = {
                ...pullRequest,
                timelineItems: {
                  ...pullRequest.timelineItems,
                  nodes: [...(pullRequest.timelineItems.nodes ?? []), newComment],
                },
              };
            }
          }
          // Handle addPullRequestReview response
          else if (result && 'addPullRequestReview' in result && result.addPullRequestReview?.pullRequestReview) {
            const newReview = result.addPullRequestReview.pullRequestReview;
            console.log('📝 Adding review to timeline');
            
            updatedPullRequest = {
              ...pullRequest,
              timelineItems: {
                ...pullRequest.timelineItems,
                nodes: [...(pullRequest.timelineItems.nodes ?? []), newReview],
              },
            };
          }
          
          set(gitHubPullRequest, updatedPullRequest);
          
          // Trigger scroll to bottom after server update to ensure the comment is visible
          set(timelineScrollToBottom, Date.now());
        } catch (error) {
          // Rollback optimistic update on failure
          if (pendingReviewID == null && event === PullRequestReviewEvent.Comment) {
            set(gitHubPullRequest, pullRequest);
          }
          throw error;
        }

        setEvent(PullRequestReviewEvent.Comment);
      },
    [event, pendingReviewID, refreshPullRequest],
  );

  return (
    <PullRequestCommentInput
      addComment={addComment}
      autoFocus={false}
      resetInputAfterAddingComment={true}
      allowEmptyMessage={hasPendingReview || event === PullRequestReviewEvent.Approve}
      label="Submit"
      actionSelector={<PullRequestReviewSelector event={event} onSelect={setEvent} />}
    />
  );
}
