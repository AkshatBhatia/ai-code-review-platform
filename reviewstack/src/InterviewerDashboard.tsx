/**
 * Interviewer Dashboard
 * 
 * Main interface for interviewers to manage scenarios and conduct interviews
 */

import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  Text, 
  TabNav,
  Pagehead,
  Label,
  Avatar,
  StyledOcticon,
  ActionList,
  ActionMenu
} from '@primer/react';
import { 
  PlusIcon, 
  ClockIcon, 
  PersonIcon, 
  BookIcon,
  PlayIcon,
  GearIcon
} from '@primer/octicons-react';
import { useRecoilValue } from 'recoil';
import { gitHubUsername } from './github/gitHubCredentials';
import { 
  currentInterviewUser, 
  interviewScenarios,
  activeInterviewSessions,
  type InterviewScenario,
  type InterviewSession
} from './interviewState';

type DashboardTab = 'scenarios' | 'sessions' | 'candidates' | 'analytics';

export default function InterviewerDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<DashboardTab>('scenarios');
  const username = useRecoilValue(gitHubUsername);
  const currentUser = useRecoilValue(currentInterviewUser);
  const scenarios = useRecoilValue(interviewScenarios);
  const sessions = useRecoilValue(activeInterviewSessions);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scenarios':
        return <ScenarioManagement scenarios={scenarios} />;
      case 'sessions': 
        return <SessionManagement sessions={sessions} />;
      case 'candidates':
        return <CandidateManagement />;
      case 'analytics':
        return <Analytics />;
      default:
        return <ScenarioManagement scenarios={scenarios} />;
    }
  };

  return (
    <Box p={4} bg="canvas.default" minHeight="100vh">
      {/* Header */}
      <Pagehead>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Avatar src={`https://github.com/${username}.png`} size={40} />
            <Box ml={3}>
              <Heading as="h1" sx={{ fontSize: 3 }}>
                Interview Dashboard
              </Heading>
              <Text color="fg.muted">
                Welcome back, {currentUser?.name || username}
              </Text>
            </Box>
          </Box>
          
          <Box display="flex" sx={{ gap: 2 }}>
            <Button variant="primary" leadingIcon={PlusIcon}>
              New Session
            </Button>
            <ActionMenu>
              <ActionMenu.Button
                variant="default"
                leadingIcon={GearIcon}
                aria-label="Settings"
              />
              <ActionMenu.Overlay>
                <ActionList>
                  <ActionList.Item>Profile Settings</ActionList.Item>
                  <ActionList.Item>Company Settings</ActionList.Item>
                  <ActionList.Divider />
                  <ActionList.Item variant="danger">Logout</ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
          </Box>
        </Box>
      </Pagehead>

      {/* Navigation Tabs */}
      <Box mt={4}>
        <TabNav aria-label="Dashboard navigation">
          <TabNav.Link 
            href="#scenarios"
            selected={activeTab === 'scenarios'}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('scenarios');
            }}
          >
            <StyledOcticon icon={BookIcon} sx={{ mr: 2 }} />
            Scenarios
          </TabNav.Link>
          <TabNav.Link
            href="#sessions" 
            selected={activeTab === 'sessions'}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('sessions');
            }}
          >
            <StyledOcticon icon={PlayIcon} sx={{ mr: 2 }} />
            Sessions
          </TabNav.Link>
          <TabNav.Link
            href="#candidates"
            selected={activeTab === 'candidates'} 
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('candidates');
            }}
          >
            <StyledOcticon icon={PersonIcon} sx={{ mr: 2 }} />
            Candidates
          </TabNav.Link>
          <TabNav.Link
            href="#analytics"
            selected={activeTab === 'analytics'}
            onClick={(e) => {
              e.preventDefault(); 
              setActiveTab('analytics');
            }}
          >
            <StyledOcticon icon={ClockIcon} sx={{ mr: 2 }} />
            Analytics
          </TabNav.Link>
        </TabNav>
      </Box>

      {/* Tab Content */}
      <Box mt={4}>
        {renderTabContent()}
      </Box>
    </Box>
  );
}

function ScenarioManagement({ scenarios }: { scenarios: InterviewScenario[] }): React.ReactElement {
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Heading as="h2" sx={{ fontSize: 2 }}>Question Bank</Heading>
        <Button variant="primary" leadingIcon={PlusIcon}>
          Create Scenario
        </Button>
      </Box>

      {scenarios.length === 0 ? (
        <Box 
          textAlign="center" 
          py={6} 
          borderWidth="1px"
          borderStyle="dashed" 
          borderColor="border.default"
          borderRadius={6}
        >
          <Text color="fg.muted" mb={3}>No scenarios created yet</Text>
          <Button variant="primary" leadingIcon={PlusIcon}>
            Create Your First Scenario
          </Button>
        </Box>
      ) : (
        <Box
          borderWidth="1px" 
          borderStyle="solid"
          borderColor="border.default"
          borderRadius={6}
        >
          {scenarios.map((scenario, index) => (
            <Box
              key={scenario.id}
              p={4}
              borderBottomWidth={index < scenarios.length - 1 ? "1px" : "0"}
              borderBottomStyle="solid"
              borderBottomColor="border.muted"
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Text fontWeight="bold" display="block" mb={1}>
                    {scenario.title}
                  </Text>
                  <Text color="fg.muted" fontSize={1} mb={2}>
                    {scenario.description}
                  </Text>
                  <Box display="flex" sx={{ gap: 2 }}>
                    <Label variant="secondary">{scenario.difficulty}</Label>
                    {scenario.focus_areas.map(area => (
                      <Label key={area} variant="accent">{area}</Label>
                    ))}
                    <Label variant="default">
                      <StyledOcticon icon={ClockIcon} sx={{ mr: 1 }} />
                      {scenario.estimated_time}m
                    </Label>
                  </Box>
                </Box>
                <Button variant="default" size="small">
                  Use Scenario
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function SessionManagement({ sessions }: { sessions: InterviewSession[] }): React.ReactElement {
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Heading as="h2" sx={{ fontSize: 2 }}>Interview Sessions</Heading>
        <Button variant="primary" leadingIcon={PlusIcon}>
          Schedule Interview
        </Button>
      </Box>

      {sessions.length === 0 ? (
        <Box 
          textAlign="center"
          py={6}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.default" 
          borderRadius={6}
        >
          <Text color="fg.muted" mb={3}>No active sessions</Text>
          <Button variant="primary" leadingIcon={PlusIcon}>
            Schedule Your First Interview
          </Button>
        </Box>
      ) : (
        <Text>Session management coming soon...</Text>
      )}
    </Box>
  );
}

function CandidateManagement(): React.ReactElement {
  return (
    <Box>
      <Heading as="h2" sx={{ fontSize: 2, mb: 4 }}>Candidate Management</Heading>
      <Text color="fg.muted">Candidate history and evaluation tools coming soon...</Text>
    </Box>
  );
}

function Analytics(): React.ReactElement {
  return (
    <Box>
      <Heading as="h2" sx={{ fontSize: 2, mb: 4 }}>Analytics</Heading>
      <Text color="fg.muted">Interview analytics and reporting coming soon...</Text>
    </Box>
  );
}