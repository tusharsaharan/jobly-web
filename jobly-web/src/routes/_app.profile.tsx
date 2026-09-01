import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Trophy, Clock, Target, Flame, BrainCircuit, GraduationCap, Briefcase, Award } from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from "recharts";

export const Route = createFileRoute("/_app/profile")({
  component: UserProfile,
});

function UserProfile() {
  const { user: authUser } = useAuth();
  
  const { data: userProfile, isLoading: isUserLoading } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiCall("/users/me"),
  });

  const { data: stats } = useQuery({
    queryKey: ["learn-stats"],
    queryFn: () => apiCall("/learn/stats"),
  });

  const user = userProfile || authUser;

  if (isUserLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream/30">
        <div className="text-ink/50 animate-pulse text-sm font-medium">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream/30">
        <div className="text-ink/60 text-sm font-medium">Please sign in to view your profile.</div>
      </div>
    );
  }

  // Radar data with intelligent fallbacks
  const radarData = stats?.radarData?.length > 0 ? stats.radarData : [
    { subject: 'System Design', A: 40, fullMark: 100 },
    { subject: 'DSA', A: 65, fullMark: 100 },
    { subject: 'Frontend', A: 80, fullMark: 100 },
    { subject: 'Backend', A: 75, fullMark: 100 },
    { subject: 'Database', A: 50, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-cream/20 px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header Profile Card */}
        <div className="rounded-2xl border border-border bg-white p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-ink flex items-center justify-center text-3xl font-bold text-white shrink-0 shadow-xs">
              {user.name?.charAt(0) || "U"}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-2xl font-bold text-ink">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cream/60 text-ink/70 border border-border capitalize">
                  {user.role || "Candidate"}
                </span>
              </div>
              <p className="text-ink/60 text-sm mt-1">{user.email}</p>
              
              {user.skills && user.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {user.skills.slice(0, 8).map((skill: string) => (
                    <span key={skill} className="px-2.5 py-1 bg-cream/40 rounded-lg text-xs font-medium text-ink border border-border/80">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 shrink-0">
               <div className="rounded-xl border border-border bg-cream/20 p-4 text-center min-w-[100px]">
                  <div className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Streak</div>
                  <div className="text-xl font-bold text-ink">{stats?.currentStreak || user.currentStreak || 0}d</div>
               </div>
               <div className="rounded-xl border border-border bg-cream/20 p-4 text-center min-w-[100px]">
                  <div className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Focus</div>
                  <div className="text-xl font-bold text-ink">{stats?.focusPoints || user.focusPoints || 0} pts</div>
               </div>
            </div>
          </div>

          {user.resumeSummary && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">Executive Summary</p>
              <p className="text-sm leading-relaxed text-ink/70">{user.resumeSummary}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Activity Overview */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
                  <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Focus Time</div>
                  <div className="text-xl font-bold text-ink mt-0.5">{Math.round((stats?.totalStudyMinutes || 0) / 60)}h {(stats?.totalStudyMinutes || 0) % 60}m</div>
               </div>
               
               <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
                  <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Quiz Accuracy</div>
                  <div className="text-xl font-bold text-ink mt-0.5">{stats?.avgScore || 0}%</div>
               </div>
            </div>

            {/* Education & Experience Highlights */}
            {(user.college || (user.experience && user.experience.length > 0)) && (
              <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
                {user.college && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-0.5">Education</div>
                    <div className="text-sm font-semibold text-ink">{user.degree || "Degree"} · {user.college}</div>
                    {user.cgpa && <div className="text-xs text-ink/60 mt-0.5">CGPA: {user.cgpa}</div>}
                  </div>
                )}

                {user.experience && user.experience.length > 0 && (
                  <div className={user.college ? "pt-3 border-t border-border/70" : ""}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-0.5">Experience</div>
                    <div className="text-sm font-semibold text-ink">{user.experience[0].title}</div>
                    <div className="text-xs text-ink/60">{user.experience[0].company} · {user.experience[0].duration}</div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Sessions */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-ink mb-4">Recent Focus Sessions</h3>
              
              {stats?.recentSessions?.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.recentSessions.map((session: any) => (
                    <div key={session._id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-cream/20">
                      <div>
                        <div className="font-semibold text-xs text-ink">{session.topic}</div>
                        <div className="text-[11px] text-ink/50 mt-0.5">
                          {new Date(session.createdAt).toLocaleDateString()} • {session.durationMinutes} mins
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          session.status === 'COMPLETED' ? 'bg-[#2A9D7B]/10 text-[#2A9D7B]' : 'bg-red-50 text-red-600'
                        }`}>
                          {session.status}
                        </span>
                        {session.type === 'QUIZ' && session.score !== undefined && (
                           <div className="mt-1 text-xs font-bold text-ink">{session.score}%</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-ink/40 text-xs">
                  No focus sessions recorded yet. Start practicing in the Learn hub!
                </div>
              )}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs flex flex-col">
            <h3 className="text-sm font-bold text-ink">Subject Mastery</h3>
            <p className="text-xs text-ink/50 mb-4">Competency matrix across domain topics</p>
            
            <div className="flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Mastery"
                    dataKey="A"
                    stroke="#1e293b"
                    fill="#1e293b"
                    fillOpacity={0.15}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
