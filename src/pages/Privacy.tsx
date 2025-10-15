import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";

const Privacy = () => {
  useEffect(() => { document.title = "Privacy Policy | Miryn"; }, []);
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto prose prose-invert">
          <h1>Privacy Policy</h1>
          <p>We respect your privacy. This policy explains what data we collect and how we use it.</p>
          <h2>What we collect</h2>
          <ul>
            <li>Account info you provide (name, email)</li>
            <li>Content you create (projects, messages)</li>
            <li>Basic analytics and cookies to improve the product</li>
          </ul>
          <h2>How we use data</h2>
          <ul>
            <li>Operate and improve core features</li>
            <li>Moderate abusive content</li>
            <li>Secure the platform</li>
          </ul>
          <h2>Your choices</h2>
          <ul>
            <li>You can update or delete your content</li>
            <li>You can request account deletion by contacting support</li>
          </ul>
          <p>Questions? Contact support via the app.</p>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
