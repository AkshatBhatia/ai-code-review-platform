# Test Cases for Three-Button Inline Comment Functionality

## Test 1: "Add Comment" (Single Comment) Functionality

### Expected Behavior
The "Add Comment" button should create immediate individual comments that are posted directly without creating pending reviews.

### Test Steps
1. Click on a line number to open inline comment input
2. Verify three buttons appear: Cancel, Start a review, Add Comment
3. Type test comment: "This is a single comment test"
4. Click "Add Comment" button

### Verification Checklist - How to Check Results

#### ✅ Comment Status (CRITICAL)
- **Look for "Pending" label**: Search the page snapshot for text containing "Pending"
- **Expected**: NO "Pending" label should appear next to the new comment
- **Actual Result**: ❌ FAILED - Comment shows "Pending" status (uid contains "Pending" text)

#### ✅ Submit Button State (CRITICAL)
- **Look for Submit button**: Find button with text "Submit" in the timeline area
- **Check disabled state**: Look for "disableable disabled" attributes
- **Expected**: Submit button should remain DISABLED (have "disableable disabled" attributes)
- **Actual Result**: ❌ FAILED - Submit button is ENABLED (no "disableable disabled" attributes found)

#### ✅ Comment Visibility
- **Expected**: Comment appears immediately with author name and regular "commented" status
- **Actual Result**: ✅ PASSED - Comment visible with author name

#### ✅ Console Logs
- **Expected**: Should show "Starting API call for inline comment" and success messages
- **Actual Result**: ✅ PASSED - Correct API calls made

### Test Result: ❌ FAILED
**Issue**: "Add Comment" button is incorrectly creating pending review comments instead of immediate individual comments.

---

## Test 2: "Start a Review" Functionality (TO BE TESTED)

### Expected Behavior
The "Start a review" button should create a pending inline review comment attached to the specific diff line, enabling the Submit button for later review submission.

### Test Steps
1. Click on a different line number to open inline comment input
2. Type test comment: "This comment starts a pending review"
3. Click "Start a review" button

### Verification Checklist - How to Check Results

#### ✅ Comment Location (CRITICAL)
- **Expected**: Comment should appear inline on the specific diff line (not in timeline)
- **How to verify**: Check that comment appears next to the line number in the diff view

#### ✅ Comment Status (CRITICAL)
- **Look for "Pending" label**: Search for text containing "Pending" next to the new comment
- **Expected**: Comment SHOULD show "Pending" status
- **How to verify**: Find comment text and check if "Pending" appears near it in the snapshot

#### ✅ Submit Button State (CRITICAL)
- **Look for Submit button**: Find button with text "Submit"
- **Check enabled state**: Verify NO "disableable disabled" attributes
- **Expected**: Submit button should become ENABLED (no disabled attributes)
- **How to verify**: Check button attributes in snapshot

#### ✅ Console Logs
- **Expected**: Should show "🚀 Starting API call for pending review comment..." and "✅ API call succeeded for pending review comment"

---

## Verification Helper Guide

### How to Check if Comment is Pending
1. Look at the page snapshot
2. Find the comment text you just added
3. Look for nearby text containing "Pending"
4. **Pending comment example**: 
   ```
   StaticText "AkshatBhatia"
   StaticText "commented" 
   StaticText "Pending"  <-- This indicates pending status
   StaticText "Your comment text here"
   ```

### How to Check Submit Button State
1. Find button with text "Submit" in the timeline area (usually near bottom)
2. Check the button's attributes:
   - **DISABLED**: `button "Submit" disableable disabled`
   - **ENABLED**: `button "Submit"` (no disabled attributes)

### How to Check Console Messages
1. Use `mcp__chrome-devtools__list_console_messages`
2. Look for specific log messages that indicate success/failure
3. Key messages to look for:
   - For inline comments: "🚀 Starting API call for inline comment..."
   - For start review: "🚀 Starting a review with comment..."

---

## Current Issues Found

### Issue 1: "Add Comment" Button Malfunction
- **Problem**: "Add Comment" creates pending comments instead of immediate comments
- **Evidence**: Comment shows "Pending" status and Submit button becomes enabled
- **Expected**: Should create immediate comment with no "Pending" status, Submit button stays disabled
- **Status**: ❌ FAILED - Requires bug fix

### Next Steps
1. Fix the "Add Comment" functionality to create immediate comments
2. Re-test "Add Comment" functionality
3. Test "Start a Review" functionality 
4. Test complete end-to-end workflow with Submit