import WelcomePage from '../WelcomePage';

export default function WelcomePageExample() {
  return (
    <WelcomePage onLogin={() => console.log('Login clicked')} />
  );
}
