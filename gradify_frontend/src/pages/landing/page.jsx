import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, UserCheck, Scale } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Navigation */}
      <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900 tracking-tight">Gradify.ai</span>
        </div>
        <div className="flex items-center">
          <a 
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors hidden md:block"
          >
            How it Works
          </a>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
          >
            Log in
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors ml-2"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up">
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            AI-Powered Answer Script <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900">Evaluation</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            An intelligent platform that helps teachers assess descriptive examination papers quickly, accurately, and fairly — reducing workload while eliminating bias.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/login')}
              className="text-base font-medium bg-slate-900 text-white px-8 py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Start Grading for Free
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-24">
          
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col items-start hover:border-gray-200 transition-colors">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6 border border-gray-100">
              <UserCheck className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Teacher in Control</h3>
            <p className="text-slate-600 leading-relaxed">
              Educators review and approve model answers before any student evaluation begins. You define the criteria, the AI simply assists.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col items-start hover:border-gray-200 transition-colors">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6 border border-gray-100">
              <Scale className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Scalable & Fair</h3>
            <p className="text-slate-600 leading-relaxed">
              Effortlessly handle large classroom volumes with consistent, bias-minimized grading. End the manual burden of checking 150+ scripts.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col items-start hover:border-gray-200 transition-colors">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6 border border-gray-100">
              <CheckCircle className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Intelligent Assessment</h3>
            <p className="text-slate-600 leading-relaxed">
              Powered by advanced OCR and LLMs to grade on keyword weightage, relevance, and completeness — providing per-question marks instantly.
            </p>
          </div>
          
        </div>
      </main>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full bg-white border-t border-gray-100 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">How Gradify Works</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">A seamless 4-step workflow designed to keep educators in full control while AI does the heavy lifting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl relative">
              <div className="text-5xl font-black text-gray-200 absolute top-4 right-4">1</div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2 relative z-10 mt-8">Exam Setup</h4>
              <p className="text-slate-600 text-sm leading-relaxed relative z-10">
                Create an evaluation blueprint. Enter your questions, allocate maximum marks, and upload a reference PDF.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl relative mt-0 md:mt-8">
              <div className="text-5xl font-black text-gray-200 absolute top-4 right-4">2</div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2 relative z-10 mt-8">AI Generation</h4>
              <p className="text-slate-600 text-sm leading-relaxed relative z-10">
                Our RAG system extracts relevant context from your PDF to generate comprehensive model answers automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl relative mt-0 md:mt-16">
              <div className="text-5xl font-black text-gray-200 absolute top-4 right-4">3</div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2 relative z-10 mt-8">Teacher Verify</h4>
              <p className="text-slate-600 text-sm leading-relaxed relative z-10">
                Review, modify, or approve the AI-generated model answers. The evaluation always reflects your exact expectations.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl relative mt-0 md:mt-24">
              <div className="text-5xl font-black text-gray-200 absolute top-4 right-4">4</div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2 relative z-10 mt-8">Auto Evaluation</h4>
              <p className="text-slate-600 text-sm leading-relaxed relative z-10">
                Upload scanned student scripts. Gradify reads the handwriting and assigns precise scores based on your rubric.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-100 py-8 px-6 text-center">
        <p className="text-slate-500 text-sm">© 2026 Gradify.ai. All rights reserved.</p>
      </footer>
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
