import { Link } from 'react-router-dom';
import {
  Monitor,
  Mic,
  Globe,
  MessageSquare,
  FileUp,
  Pen,
  ArrowRight,
  Users,
  Zap,
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: Monitor,
    title: 'Screen Sharing',
    description: 'Share your screen with the team in real-time with crystal clear quality.',
  },
  {
    icon: Mic,
    title: 'Voice & Video',
    description: 'Crystal clear audio and video communication with your collaborators.',
  },
  {
    icon: Globe,
    title: 'Collaborative Browser',
    description: 'Browse the web together with synchronized navigation.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Instant messaging with rich text support and file attachments.',
  },
  {
    icon: FileUp,
    title: 'File Sharing',
    description: 'Share files of any size with drag-and-drop simplicity.',
  },
  {
    icon: Pen,
    title: 'Whiteboard',
    description: 'Collaborate visually with an infinite digital whiteboard.',
  },
];

const steps = [
  { step: '1', title: 'Create Room', description: 'Set up your virtual space with custom settings.' },
  { step: '2', title: 'Share Link', description: 'Invite your team with a simple shareable link.' },
  { step: '3', title: 'Join', description: 'Team members join with one click from any device.' },
  { step: '4', title: 'Collaborate', description: 'Work together in real-time with powerful tools.' },
];

export default function LandingPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[200px]" />
      </div>

      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-400 mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-indigo-400" />
            Real-time collaborative spaces
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Your Room. Your Browser.
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Your Team.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create collaborative spaces where teams share screens, browse together, and work in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/create"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Create Room
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/join"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-semibold transition-all backdrop-blur-sm"
            >
              Join Room
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              End-to-end encryption
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Up to 50 participants
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              No download required
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need</h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              A complete suite of collaboration tools built for modern teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mb-4 group-hover:from-indigo-500/30 group-hover:to-purple-600/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-gray-400">Get started in four simple steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t border-white/10" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-2xl font-bold text-indigo-400 mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to collaborate?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Create your first room in seconds. No sign-up required for guests.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              R
            </div>
            <span className="text-sm font-semibold text-gray-400">RoomX - Collaborative Virtual Rooms</span>
          </div>
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} RoomX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
