/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PullRequestCommentInput from './PullRequestCommentInput';
import PullRequestReviewSelector from './PullRequestReviewSelector';
import {PullRequestReviewEvent} from './generated/graphql';
import {gitHubClient, gitHubPullRequest, gitHubPullRequestPendingReviewID} from './recoil';
import {gitHubUsername} from './github/gitHubCredentials';
import {timelineScrollToBottom} from './PullRequestLayout';
import useRefreshPullRequest from './useRefreshPullRequest';
import {useState} from 'react';
import {useRecoilCallback, useRecoilValue} from 'recoil';

export default function PullRequestTimelineCommentInput(): React.ReactElement {
  const pendingReviewID = useRecoilValue(gitHubPullRequestPendingReviewID);
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
          
          if (pendingReviewID == null) {
            if (event === PullRequestReviewEvent.Comment) {
              result = await client.addComment(pullRequest.id, comment);
            } else {
              result = await client.addPullRequestReview({
                body: comment,
                pullRequestId: pullRequest.id,
                event,
              });
            }
          } else {
            // For merged/closed PRs, we still need to submit the pending review
            // Don't convert to regular comments - just submit the review normally
            result = await client.submitPullRequestReview({
              body: comment,
              pullRequestId: pullRequest.id,
              pullRequestReviewId: pendingReviewID,
              event,
            });
          }

          console.log('✅ API call succeeded for timeline comment');
          
          // Refresh pull request data to update pending review status
          refreshPullRequest();
          
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
      allowEmptyMessage={pendingReviewID != null || event === PullRequestReviewEvent.Approve}
      label="Submit"
      actionSelector={<PullRequestReviewSelector event={event} onSelect={setEvent} />}
    />
  );
}
