import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface TeamInvitationEmailProps {
  firstName: string;
  lastName: string;
  role: string;
  username: string;
  tempPassword: string;
  loginUrl: string;
  companyName: string;
}

export const TeamInvitationEmail = ({
  firstName,
  lastName,
  role,
  username,
  tempPassword,
  loginUrl,
  companyName,
}: TeamInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {companyName} - Set up your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {companyName}</Heading>
        
        <Text style={text}>
          Hi {firstName},
        </Text>
        
        <Text style={text}>
          You've been invited to join <strong>{companyName}</strong> as a <strong>{role}</strong>.
        </Text>

        <Section style={codeContainer}>
          <Text style={label}>Your Login Credentials:</Text>
          <Text style={credentialText}>
            <strong>Username:</strong> {username}
          </Text>
          <Text style={credentialText}>
            <strong>Temporary Password:</strong> <code style={code}>{tempPassword}</code>
          </Text>
        </Section>

        <Text style={text}>
          Please click the button below to log in and set your permanent password:
        </Text>

        <Section style={buttonContainer}>
          <Link href={loginUrl} style={button}>
            Login & Set Password
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          For security reasons, please change your password immediately after logging in.
          If you have any questions, please contact your administrator.
        </Text>

        <Text style={footer}>
          This is an automated email. Please do not reply to this message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TeamInvitationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const label = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0 40px',
};

const credentialText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '8px 0',
  padding: '0 40px',
};

const code = {
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  color: '#e74c3c',
  fontFamily: 'monospace',
  fontSize: '14px',
  padding: '4px 8px',
};

const codeContainer = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const buttonContainer = {
  padding: '24px 40px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '12px',
};
