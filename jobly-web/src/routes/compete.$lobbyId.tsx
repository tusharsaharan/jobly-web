import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { getInterviewSocket as getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { Users, Play, Crown, AlertCircle, SkipNext } from "lucide-react";
import QuizArena from "@/components/compete/QuizArena";
import CPArena from "@/components/compete/CPArena";

export const Route = createFileRoute("/compete/$lobbyId")({
  component: CompeteArena,
});

function CompeteArena() {
  const { lobbyId } = Route.useParams();
  const navigate = useNavigate();
  
  const { data: user } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiCall("/users/me"),
  });

  const { data: initialLobby, isLoading, error } = useQuery({
    queryKey: ["lobby", lobbyId],
    queryFn: () => apiCall(`/compete/${lobbyId}`),
  });

  const [lobbyState, setLobbyState] = useState<any>(null);

  useEffect(() => {
    if (initialLobby?.lobby) {
      setLobbyState(initialLobby.lobby);
    }
  }, [initialLobby]);

  useEffect(() => {
    if (!lobbyState || !user) return;
    
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    // Join the realtime room
    socket.emit("join_comp_lobby", { pin: lobbyState.pin });

    const handlePlayerJoined = (data: any) => {
      setLobbyState((prev: any) => {
        // avoid duplicates
        if (prev.players.find((p: any) => p.userId === data.userId)) return prev;
        return {
          ...prev,
          players: [...prev.players, { userId: data.userId, name: data.name, score: 0 }]
        };
      });
      toast(`${data.name} joined!`);
    };

    const handleCompStarted = (data: any) => {
      setLobbyState((prev: any) => ({ ...prev, status: "PLAYING" }));
      // Server sends first question data for quiz mode
      if (data.questionIndex !== undefined && data.question) {
        setLobbyState((prev: any) => ({
          ...prev,
          currentQuestionIndex: data.questionIndex,
          quizData: prev.quizData // already loaded
        }));
      }
    };

    const handleQuestionChanged = (data: any) => {
      setLobbyState((prev: any) => ({
        ...prev,
        currentQuestionIndex: data.questionIndex
      }));
    };

    const handleQuizComplete = (data: any) => {
      setLobbyState((prev: any) => ({ 
        ...prev, 
        status: "LEADERBOARD", 
        players: data.finalScores 
      }));
    };

    socket.on("player_joined", handlePlayerJoined);
    socket.on("comp_started", handleCompStarted);
    socket.on("question_changed", handleQuestionChanged);
    socket.on("quiz_complete", handleQuizComplete);

    return () => {
      socket.off("player_joined", handlePlayerJoined);
      socket.off("comp_started", handleCompStarted);
      socket.off("question_changed", handleQuestionChanged);
      socket.off("quiz_complete", handleQuizComplete);
    };
  }, [lobbyState?.pin, user]);

  if (isLoading || !lobbyState || !user) {
    return <div className="min-h-screen bg-ink flex items-center justify-center text-white font-mono">Loading Arena...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Lobby not found</h2>
        <button onClick={() => navigate({ to: "/compete" })} className="mt-6 px-6 py-2 bg-white text-ink rounded-full font-bold">Go Back</button>
      </div>
    );
  }

  const isHost = lobbyState.hostId === user._id;

  const handleStartGame = () => {
    if (!isHost) return;
    const socket = getSocket();
    socket.emit("start_comp", { pin: lobbyState.pin });
    setLobbyState({ ...lobbyState, status: "PLAYING" });
  };

  if (lobbyState.status === "WAITING") {
    return (
      <div className="min-h-screen bg-ink text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Gamified Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="z-10 text-center mb-12">
          <div className="inline-block bg-white/10 px-4 py-1 rounded-full text-sm font-bold tracking-widest text-mint mb-4 uppercase">
            {lobbyState.mode} MODE
          </div>
          <h1 className="text-5xl font-black mb-4">{lobbyState.topic}</h1>
          <p className="text-xl text-white/70 flex items-center justify-center">
            Go to <span className="font-mono bg-white text-ink px-2 py-1 mx-2 rounded font-bold">/compete</span> and enter PIN:
          </p>
          <div className="text-8xl font-black tracking-widest mt-6 text-mint drop-shadow-[0_0_15px_rgba(42,228,162,0.5)]">
            {lobbyState.pin}
          </div>
        </div>

        <div className="z-10 w-full max-w-4xl bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center">
              <Users className="w-6 h-6 mr-3 text-mint" /> 
              Players ({lobbyState.players.length})
            </h2>
            {isHost && (
              <button 
                onClick={handleStartGame}
                disabled={lobbyState.players.length < 1}
                className="bg-mint text-ink px-8 py-3 rounded-full font-black text-lg hover:scale-105 transition-transform flex items-center disabled:opacity-50 disabled:hover:scale-100"
              >
                <Play className="w-5 h-5 mr-2 fill-current" /> START GAME
              </button>
            )}
            {!isHost && (
              <div className="text-white/50 font-medium animate-pulse">
                Waiting for host to start...
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {lobbyState.players.map((p: any) => (
              <div key={p.userId} className="bg-white/10 rounded-xl p-4 text-center font-bold relative group">
                {p.userId === lobbyState.hostId && (
                  <Crown className="w-4 h-4 text-yellow-400 absolute top-2 right-2" />
                )}
                <div className="text-xl truncate">{p.name}</div>
                {p.userId === user._id && <div className="text-xs text-mint mt-1">You</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PLAYING STATE
  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {lobbyState.mode === "QUIZ" ? (
        <QuizArena lobbyState={lobbyState} user={user} setLobbyState={setLobbyState} />
      ) : (
        <CPArena lobbyState={lobbyState} user={user} setLobbyState={setLobbyState} />
      )}
    </div>
  );
}
