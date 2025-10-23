import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Terms = () => {
  useEffect(() => { document.title = "Terms of Service | Miryn"; }, []);
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto prose prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Miryn ("the Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the Service.
          </p>

          <h2>2. Age Requirements</h2>
          <p>
            You must be at least 13 years of age to use this Service. If you are located in the European Union, 
            you must be at least 16 years of age. By using this Service, you represent and warrant that you meet 
            these age requirements.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account and password. Miryn cannot and will 
            not be liable for any loss or damage from your failure to comply with this security obligation. You 
            are responsible for all content posted and activity that occurs under your account.
          </p>

          <h2>4. Acceptable Use & Content Guidelines</h2>
          <p>You agree not to use the Service to post, share, or promote content that:</p>
          <ul>
            <li>Contains violence, threats, or harassment toward any individual or group</li>
            <li>Contains hate speech, discrimination, or promotes intolerance</li>
            <li>Contains adult, sexual, or explicit content</li>
            <li>Promotes illegal activities, drugs, or dangerous behavior</li>
            <li>Infringes on intellectual property rights of others</li>
            <li>Contains spam, scams, or deceptive practices</li>
            <li>Violates any applicable laws or regulations</li>
            <li>Contains malware, viruses, or malicious code</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            You retain all rights to the content you post on Miryn. By posting content, you grant Miryn a 
            worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your 
            content solely for the purpose of operating and promoting the Service.
          </p>

          <h2>6. Account Termination</h2>
          <p>
            Miryn reserves the right to suspend or terminate your account at any time for violations of these 
            Terms of Service, including but not limited to posting prohibited content, engaging in abusive 
            behavior, or any activity that harms the Service or its users.
          </p>

          <h2>7. Advertising</h2>
          <p>
            This Service displays advertisements provided by Google AdSense. By using this Service, you acknowledge 
            that third-party vendors, including Google, use cookies to serve ads based on your prior visits to this 
            website and other websites. You may opt out of personalized advertising by visiting 
            {" "}<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ad Settings</a>.
          </p>

          <h2>8. Privacy & Data</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. Please review our 
            {" "}<a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> to understand how we 
            collect, use, and protect your personal information.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, either express or 
            implied. Miryn does not warrant that the Service will be uninterrupted, secure, or error-free.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Miryn shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or 
            indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            Miryn reserves the right to modify these Terms of Service at any time. We will notify users of any 
            material changes by posting the updated terms on this page. Your continued use of the Service after 
            changes are posted constitutes acceptance of the modified terms.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable international laws. Any 
            disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration.
          </p>

          <h2>13. Contact</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us through the 
            {" "}<a href="/feedback" className="text-primary hover:underline">Feedback page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
