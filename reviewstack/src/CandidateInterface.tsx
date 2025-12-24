/**
 * Candidate Interface
 * 
 * Simple interface for candidates to join interview sessions
 */

import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  Text, 
  TextInput,
  Avatar,
  Label,
  StyledOcticon
} from '@primer/react';
import { 
  ClockIcon, 
  PersonIcon, 
  ShieldCheckIcon
} from '@primer/octicons-react';
import { useRecoilValue } from 'recoil';
import { gitHubUsername } from './github/gitHubCredentials';
import { currentInterviewUser } from './interviewState';

export default function CandidateInterface(): React.ReactElement {
  const [sessionCode, setSessionCode] = useState('');
  const username = useRecoilValue(gitHubUsername);
  const currentUser = useRecoilValue(currentInterviewUser);

  const handleJoinSession = () => {
    // TODO: Implement session joining logic
    console.log('Joining session with code:', sessionCode);
  };

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      minHeight="100vh"
      p={4}
      bg="canvas.default"
    >
      <Box 
        maxWidth="600px" 
        width="100%"
        p={6} 
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border.default"
        borderRadius={6}
        bg="canvas.subtle"
      >
        {/* Header */}
        <Box display="flex" alignItems="center" mb={6}>
          <Avatar src={`https://github.com/${username}.png`} size={48} />
          <Box ml={3}>
            <Heading as="h1" sx={{ fontSize: 3, fontWeight: 600 }}>
              Welcome, {currentUser?.name || username}!
            </Heading>
            <Text color="fg.muted" fontSize={1}>
              Ready for your coding interview?
            </Text>
          </Box>
        </Box>

        {/* Join Session Section */}
        <Box mb={6}>
          <Heading as="h2" sx={{ fontSize: 2, mb: 3 }}>
            Join Interview Session
          </Heading>
          <Text color="fg.muted" sx={{ mb: 3 }}>
            Enter the session code provided by your interviewer to get started.
          </Text>
          
          <Box display="flex" sx={{ gap: 2 }}>
            <TextInput
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              placeholder="Enter session code (e.g., ABC-123-XYZ)"
              sx={{ flexGrow: 1 }}
              size="large"
            />
            <Button 
              variant="primary" 
              size="large"
              onClick={handleJoinSession}
              disabled={!sessionCode.trim()}
            >
              Join Session
            </Button>
          </Box>
        </Box>

        {/* Instructions */}
        <Box
          p={4}
          bg="accent.subtle"
          borderRadius={6}
          borderWidth="1px"
          borderStyle="solid"
          borderColor="accent.muted"
          mb={4}
        >
          <Heading as="h3" sx={{ fontSize: 1, fontWeight: 600, mb: 2 }}>
            What to Expect
          </Heading>
          
          <Box as="ul" pl={4} mb={0}>
            <Text as="li" sx={{ fontSize: 1, mb: 1 }}>
              You'll review code and identify potential issues
            </Text>
            <Text as="li" sx={{ fontSize: 1, mb: 1 }}>
              Ask questions and discuss your findings with the interviewer
            </Text>
            <Text as="li" sx={{ fontSize: 1, mb: 1 }}>
              Sessions typically last 30-60 minutes
            </Text>
            <Text as="li" sx={{ fontSize: 1 }}>
              Focus on communication and problem-solving approach
            </Text>
          </Box>
        </Box>

        {/* Tips Section */}
        <Box>
          <Heading as="h3" sx={{ fontSize: 1, fontWeight: 600, mb: 3 }}>
            Interview Tips
          </Heading>
          
          <Box display="flex" flexDirection="column" sx={{ gap: 2 }}>
            <Box display="flex" alignItems="flex-start">
              <StyledOcticon icon={PersonIcon} size={16} sx={{ mr: 2, mt: 1, color: "accent.fg" }} />
              <Text sx={{ fontSize: 1 }}>
                <Text fontWeight="bold">Think out loud:</Text> Share your reasoning as you review the code
              </Text>
            </Box>
            
            <Box display="flex" alignItems="flex-start">
              <StyledOcticon icon={ClockIcon} size={16} sx={{ mr: 2, mt: 1, color: "accent.fg" }} />
              <Text sx={{ fontSize: 1 }}>
                <Text fontWeight="bold">Manage your time:</Text> Start with obvious issues, then dive deeper
              </Text>
            </Box>
            
            <Box display="flex" alignItems="flex-start">
              <StyledOcticon icon={ShieldCheckIcon} size={16} sx={{ mr: 2, mt: 1, color: "accent.fg" }} />
              <Text sx={{ fontSize: 1 }}>
                <Text fontWeight="bold">Consider all aspects:</Text> Security, performance, maintainability, and style
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box 
          mt={6} 
          pt={4} 
          borderTopWidth="1px"
          borderTopStyle="solid"
          borderTopColor="border.muted"
          textAlign="center"
        >
          <Text sx={{ fontSize: 0 }} color="fg.muted">
            Having technical issues? Contact your interviewer for assistance.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}