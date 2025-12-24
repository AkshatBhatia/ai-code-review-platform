/**
 * Role Selection Dialog
 * 
 * Appears after GitHub authentication to let users choose their role
 */

import React from 'react';
import { Box, Button, Text, Heading, Avatar, StyledOcticon } from '@primer/react';
import { PersonIcon, OrganizationIcon } from '@primer/octicons-react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { gitHubUsername } from './github/gitHubCredentials';
import { interviewUserRole, type UserRole } from './interviewState';

export default function RoleSelectionDialog(): React.ReactElement {
  const username = useRecoilValue(gitHubUsername);
  const setUserRole = useSetRecoilState(interviewUserRole);

  const handleRoleSelection = (role: UserRole) => {
    setUserRole(role);
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
        maxWidth="500px" 
        p={6} 
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border.default"
        borderRadius={6}
        bg="canvas.subtle"
      >
        <Box display="flex" alignItems="center" mb={4}>
          <Avatar src={`https://github.com/${username}.png`} size={48} />
          <Box ml={3}>
            <Heading as="h2" sx={{ fontSize: 2, fontWeight: 600 }}>
              Welcome, {username}!
            </Heading>
            <Text color="fg.muted" fontSize={1}>
              Choose your role to get started
            </Text>
          </Box>
        </Box>

        <Text mb={4} color="fg.default">
          Are you here to conduct interviews or participate as a candidate?
        </Text>

        <Box display="flex" flexDirection="column" sx={{ gap: 3 }}>
          <Button
            variant="primary"
            size="large"
            onClick={() => handleRoleSelection('interviewer')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              p: 3,
              textAlign: 'left'
            }}
          >
            <StyledOcticon icon={OrganizationIcon} size={20} sx={{ mr: 3 }} />
            <Box>
              <Text fontWeight="bold" display="block">I'm an Interviewer</Text>
              <Text fontSize={0} color="fg.muted" display="block">
                Create scenarios, conduct interviews, and evaluate candidates
              </Text>
            </Box>
          </Button>

          <Button
            variant="default"
            size="large" 
            onClick={() => handleRoleSelection('candidate')}
            sx={{
              display: 'flex',
              alignItems: 'center', 
              justifyContent: 'flex-start',
              p: 3,
              textAlign: 'left'
            }}
          >
            <StyledOcticon icon={PersonIcon} size={20} sx={{ mr: 3 }} />
            <Box>
              <Text fontWeight="bold" display="block">I'm a Candidate</Text>
              <Text fontSize={0} color="fg.muted" display="block">
                Join an interview session and showcase your code review skills
              </Text>
            </Box>
          </Button>
        </Box>

        <Text fontSize={0} color="fg.muted" mt={4} textAlign="center">
          You can change this role later from your profile settings
        </Text>
      </Box>
    </Box>
  );
}