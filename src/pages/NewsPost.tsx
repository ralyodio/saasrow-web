import { useParams, Link, Navigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function NewsPostPage() {
  const { id } = useParams<{ id: string }>()

  const newsItems: Record<string, {
    title: string
    date: string
    content: string
  }> = {
    'ai-tools-software-development': {
      title: 'New AI Tools Transform Software Development',
      date: 'October 20, 2025',
      content: `
        <p>The landscape of software development is undergoing a dramatic transformation thanks to cutting-edge AI-powered tools. These innovative solutions are not just speeding up development cycles but fundamentally changing how developers approach problem-solving.</p>

        <h2>The Rise of AI-Assisted Coding</h2>
        <p>AI coding assistants have evolved from simple autocomplete features to sophisticated partners in the development process. Tools like GitHub Copilot, Tabnine, and CodeWhisperer now understand context, suggest entire functions, and even help debug complex issues in real-time.</p>

        <h2>Impact on Developer Productivity</h2>
        <p>Recent studies show that developers using AI tools are 30-50% more productive, allowing them to focus on higher-level architectural decisions while the AI handles routine coding tasks. This shift is particularly beneficial for:</p>
        <ul>
          <li>Rapid prototyping and MVP development</li>
          <li>Code refactoring and optimization</li>
          <li>Documentation generation</li>
          <li>Test case creation</li>
        </ul>

        <h2>The Future of Development</h2>
        <p>As these tools continue to evolve, we're seeing a shift toward more collaborative human-AI development workflows. The future isn't about replacing developers but augmenting their capabilities to build better software faster.</p>
      `,
    },
    'top-productivity-apps-2025': {
      title: 'Top 10 Productivity Apps of 2025',
      date: 'October 15, 2025',
      content: `
        <p>In our increasingly digital world, the right productivity tools can make the difference between chaos and efficiency. After extensive testing, we've compiled the definitive list of the best productivity applications that are transforming how professionals work in 2025.</p>

        <h2>1. Focus Flow - AI-Powered Time Management</h2>
        <p>Focus Flow uses machine learning to analyze your work patterns and automatically schedule optimal work blocks. It learns when you're most productive and helps you protect those golden hours.</p>

        <h2>2. TaskMatrix - Visual Project Organization</h2>
        <p>This innovative tool combines Kanban boards with mind mapping, allowing teams to visualize both the big picture and granular tasks simultaneously.</p>

        <h2>3. DeepWork Studio - Distraction-Free Environment</h2>
        <p>More than just a writing app, DeepWork Studio creates a complete focus environment by blocking distractions, managing notifications, and providing ambient soundscapes.</p>

        <h2>Key Trends in Productivity Tools</h2>
        <ul>
          <li>AI-powered insights and recommendations</li>
          <li>Cross-platform synchronization</li>
          <li>Integration with communication platforms</li>
          <li>Wellness features to prevent burnout</li>
          <li>Privacy-first data handling</li>
        </ul>

        <p>The common thread among all these tools is their focus on reducing cognitive load while maximizing output. They understand that true productivity isn't about doing more—it's about doing the right things at the right time.</p>
      `,
    },
    'security-best-practices-saas': {
      title: 'Security Best Practices for SaaS Applications',
      date: 'October 10, 2025',
      content: `
        <p>As SaaS applications become increasingly central to business operations, security can no longer be an afterthought. The cost of a security breach—both financial and reputational—demands that SaaS providers implement robust security measures from day one.</p>

        <h2>Authentication and Authorization</h2>
        <p>The foundation of SaaS security starts with proper authentication. Implement multi-factor authentication (MFA) as a standard feature, not an optional add-on. Use industry-standard protocols like OAuth 2.0 and OpenID Connect for authentication flows.</p>

        <h2>Data Encryption</h2>
        <p>Encrypt data both in transit and at rest. Use TLS 1.3 for all network communications and ensure sensitive data stored in your database is encrypted using strong encryption algorithms like AES-256.</p>

        <h2>Regular Security Audits</h2>
        <p>Schedule quarterly security audits and penetration testing. These shouldn't be checkbox exercises but thorough examinations of your security posture including:</p>
        <ul>
          <li>Vulnerability scanning and patch management</li>
          <li>Access control reviews</li>
          <li>Incident response plan testing</li>
          <li>Third-party dependency audits</li>
        </ul>

        <h2>Compliance and Standards</h2>
        <p>Stay compliant with relevant regulations like GDPR, HIPAA, or SOC 2. These aren't just legal requirements—they're frameworks that help you build more secure systems.</p>

        <h2>Security Monitoring</h2>
        <p>Implement real-time security monitoring and logging. Use tools like SIEM (Security Information and Event Management) systems to detect and respond to threats quickly. Set up alerts for suspicious activities such as:</p>
        <ul>
          <li>Multiple failed login attempts</li>
          <li>Unusual data access patterns</li>
          <li>Changes to user permissions</li>
          <li>API rate limit violations</li>
        </ul>

        <p>Remember: security is not a one-time implementation but an ongoing commitment. Regular updates, employee training, and staying informed about emerging threats are essential to maintaining a secure SaaS application.</p>
      `,
    },
  }

  if (!id || !newsItems[id]) {
    return <Navigate to="/news" replace />
  }

  const post = newsItems[id]

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-[800px] mx-auto px-4 py-12">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-[#4FFFE3] font-ubuntu mb-8 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to News
          </Link>

          <article className="bg-[#3a3a3a] rounded-2xl p-8 md:p-12">
            <p className="text-[#4FFFE3] font-ubuntu text-sm mb-4">{post.date}</p>
            <h1 className="text-white text-4xl md:text-5xl font-bold font-ubuntu mb-8">
              {post.title}
            </h1>

            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontFamily: 'Ubuntu, sans-serif',
                fontSize: '1.125rem',
                lineHeight: '1.75'
              }}
            />
          </article>
        </main>

        <Footer />
      </div>

      <style>{`
        .prose h2 {
          color: white;
          font-size: 1.875rem;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-family: Ubuntu, sans-serif;
        }

        .prose p {
          margin-bottom: 1.5rem;
        }

        .prose ul {
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
          list-style-type: disc;
        }

        .prose li {
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  )
}
