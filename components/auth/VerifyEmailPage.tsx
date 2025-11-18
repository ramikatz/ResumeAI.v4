
import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';
import { Button } from '../ui/Button';
import { EnvelopeIcon } from '../icons/EnvelopeIcon';

interface VerifyEmailPageProps {
  user: User;
  onVerified: () => void;
}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ user, onVerified }) => {
  const { verifyUser } = useContext(AuthContext);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = () => {
    verifyUser(user.email);
    setIsVerified(true);
    setTimeout(() => {
        onVerified();
    }, 2000); // Wait 2 seconds before redirecting to login
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-slate-200">
            <EnvelopeIcon className="w-16 h-16 mx-auto text-blue-500" />
          
            <h1 className="text-2xl font-bold text-slate-800 mt-6">
                Please Verify Your Email
            </h1>
          
            <p className="text-slate-600 mt-2">
                An email has been sent to <span className="font-semibold">{user.email}</span>.
            </p>
            
            {!isVerified ? (
                <>
                    <p className="text-sm text-slate-500 mt-4">
                        To simulate verification, click the button below. In a real application, you would click a link in the email.
                    </p>
                    <Button onClick={handleVerify} className="mt-8 w-full">
                        Verify My Email
                    </Button>
                </>
            ) : (
                 <div className="mt-8 p-4 bg-green-100 text-green-800 rounded-md">
                    <p className="font-semibold">Verification Successful!</p>
                    <p className="text-sm">Redirecting you to the login page...</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
