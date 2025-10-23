import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  useEffect(() => { document.title = "Privacy Policy | Miryn"; }, []);
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto prose prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
          <p>
            At Miryn, we respect your privacy and are committed to protecting your personal information. 
            This Privacy Policy explains how we collect, use, share, and protect your data when you use our Service.
          </p>

          <h2>1. Information We Collect</h2>
          
          <h3>Account Information</h3>
          <ul>
            <li>Email address and password (encrypted)</li>
            <li>Username and display name</li>
            <li>Profile information (bio, avatar, social links)</li>
            <li>Two-factor authentication settings (if enabled)</li>
          </ul>

          <h3>Content You Create</h3>
          <ul>
            <li>Projects (titles, descriptions, images, tech stack)</li>
            <li>Services offered and service requests</li>
            <li>Messages and direct communications</li>
            <li>Comments, likes, and bookmarks</li>
          </ul>

          <h3>Usage Data</h3>
          <ul>
            <li>Device information (browser type, operating system)</li>
            <li>IP address and general location (country/region)</li>
            <li>Pages visited and features used</li>
            <li>Date and time of access</li>
          </ul>

          <h3>Cookies and Tracking Technologies</h3>
          <ul>
            <li>Essential cookies for authentication and security</li>
            <li>Analytics cookies to improve the Service</li>
            <li>Advertising cookies from Google AdSense (optional, with consent)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li><strong>Provide and maintain the Service</strong>: Account management, content display, messaging</li>
            <li><strong>Improve user experience</strong>: Analytics to understand how users interact with Miryn</li>
            <li><strong>Security and fraud prevention</strong>: Protect against unauthorized access and abuse</li>
            <li><strong>Communication</strong>: Send important notifications about your account and service updates</li>
            <li><strong>Content moderation</strong>: Review and remove content that violates our Terms of Service</li>
            <li><strong>Advertising</strong>: Display personalized ads through Google AdSense (with your consent)</li>
          </ul>

          <h2>3. Third-Party Services & Data Sharing</h2>
          
          <h3>Google AdSense</h3>
          <p>
            We use Google AdSense to display advertisements on our Service. Google may use cookies and other tracking 
            technologies to serve ads based on your prior visits to our website or other websites. You can opt out of 
            personalized advertising by visiting{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Google Ad Settings
            </a>{" "}
            or{" "}
            <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              aboutads.info
            </a>.
          </p>

          <h3>We Do Not Sell Your Data</h3>
          <p>
            We do not sell your personal information to third parties. We may share data only in the following limited circumstances:
          </p>
          <ul>
            <li><strong>With your consent</strong>: When you explicitly authorize us to share information</li>
            <li><strong>Service providers</strong>: Hosting, analytics, and email services that help us operate Miryn</li>
            <li><strong>Legal requirements</strong>: When required by law, court order, or to protect our legal rights</li>
            <li><strong>Business transfers</strong>: In the event of a merger, acquisition, or sale of assets</li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you services. 
            You can request deletion of your account at any time through our Feedback page. After deletion, some information 
            may be retained for legal, security, or backup purposes for a limited time.
          </p>

          <h2>5. Your Rights (GDPR & CCPA Compliance)</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li><strong>Access</strong>: Request a copy of your personal data</li>
            <li><strong>Correction</strong>: Update or correct inaccurate information</li>
            <li><strong>Deletion</strong>: Request deletion of your account and data</li>
            <li><strong>Opt-out</strong>: Opt out of marketing communications or personalized advertising</li>
            <li><strong>Data portability</strong>: Request your data in a machine-readable format</li>
            <li><strong>Withdraw consent</strong>: Withdraw consent for data processing at any time</li>
          </ul>
          <p>
            To exercise these rights, please contact us through our{" "}
            <a href="/feedback" className="text-primary hover:underline">Feedback page</a>.
          </p>

          <h2>6. Age Requirements</h2>
          <p>
            Miryn is not intended for users under the age of 13. If you are located in the European Union, you must be 
            at least 16 years old. We do not knowingly collect personal information from children under these ages. 
            If we become aware that we have collected information from a child under the minimum age, we will take steps 
            to delete that information.
          </p>

          <h2>7. International Data Transfers</h2>
          <p>
            Your information may be transferred to and stored on servers located outside your country of residence. 
            By using Miryn, you consent to the transfer of your data to countries that may have different data protection 
            laws than your jurisdiction.
          </p>

          <h2>8. Security Measures</h2>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul>
            <li>Encrypted password storage</li>
            <li>Two-factor authentication (optional)</li>
            <li>Secure HTTPS connections</li>
            <li>Regular security audits and monitoring</li>
          </ul>
          <p>
            However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security 
            of your data.
          </p>

          <h2>9. Cookie Policy</h2>
          <p>
            We use cookies to enhance your experience on Miryn. You can manage your cookie preferences through our 
            consent banner or your browser settings. Disabling certain cookies may affect the functionality of the Service.
          </p>

          <h3>Types of Cookies We Use</h3>
          <ul>
            <li><strong>Essential cookies</strong>: Required for authentication and core functionality</li>
            <li><strong>Analytics cookies</strong>: Help us understand how users interact with the Service</li>
            <li><strong>Advertising cookies</strong>: Used by Google AdSense for personalized ads (optional)</li>
          </ul>

          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
            the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this 
            Privacy Policy periodically.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, 
            please contact us through our{" "}
            <a href="/feedback" className="text-primary hover:underline">Feedback page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
